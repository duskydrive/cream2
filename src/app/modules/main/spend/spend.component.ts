import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store';
import * as BudgetActions from '../../../store/budget/budget.actions';
import * as BudgetSelectors from 'src/app/store/budget/budget.selectors';
import * as UserSelectors from 'src/app/store/user/user.selectors';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { FormHelpersService } from 'src/app/shared/services/form-helpers.service';
import { Unsub } from 'src/app/core/classes/unsub';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatTable } from '@angular/material/table';
import { IBudgetTitleAndId } from 'src/app/core/models/interfaces';
import { EMPTY, Observable, Subject, distinctUntilChanged, filter, map, pairwise, startWith, switchMap, take, takeUntil, tap} from 'rxjs';
import { IBudget, IExpense, ISpend } from 'src/app/shared/models/budget.interface';
import * as moment from 'moment';
import { Timestamp } from '@angular/fire/firestore';
import { isEqual } from 'lodash';
import { MatDialog } from '@angular/material/dialog';
import { BudgetCalculatorService } from 'src/app/shared/services/budget-calculator.service';
import { Router } from '@angular/router';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';

@Component({
  selector: 'app-spend',
  templateUrl: './spend.component.html',
  styleUrls: ['./spend.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpendComponent extends Unsub implements OnInit {
  public displayedColumns: string[] = ['items', 'category', 'amount', 'balance', 'action'];
  public currentBudget$: Observable<IBudget | null> = this.store.select(BudgetSelectors.selectCurrentBudget);
  public currentBudgetId$: Observable<string | undefined> = this.store.select(BudgetSelectors.selectCurrentBudgetId);
  public budgets$: Observable<IBudgetTitleAndId[] | null> = this.store.select(BudgetSelectors.selectBudgetsTitlesAndIds);
  public currentSpend$: Observable<ISpend[]> = this.store.select(BudgetSelectors.selectCurrentSpend);
  public expenses: IExpense[] = [];
  public dayOfWeek$ = new Subject();
  public dataSource: any[] = [];
  public allSpend: ISpend[] = [];
  public minCalendarDate: Date | null = null;
  public maxCalendarDate: Date | null = null;
  public spendForm: FormGroup;
  private userId$: Observable<string | null> = this.store.select(UserSelectors.selectUserId);

  @ViewChild(MatTable) table!: MatTable<any>;

  constructor(
    public formHelpersService: FormHelpersService,
    public budgetCalculatorService: BudgetCalculatorService,
    private formBuilder: FormBuilder,
    private store: Store<AppState>,
    private router: Router,
    private snackbarService: SnackbarService,
    private matDialog: MatDialog,
  ) {
    super();

    this.spendForm = this.formBuilder.group({
      currentDate: [null, []],
    });
  }

  spendFormGroup: FormGroup = this.formBuilder.group({
    spendArray: this.formBuilder.array([]),
  });

  get currentDate(): AbstractControl {
    return this.spendForm.get('currentDate') as AbstractControl;
  }

  get spendArray(): FormArray<FormGroup> {
    return this.spendFormGroup.get('spendArray') as FormArray;
  }
    
  public ngOnInit() {
    this.budgets$.pipe(
      filter((budgetsTitlesAndIds: IBudgetTitleAndId[] | null): budgetsTitlesAndIds is IBudgetTitleAndId[] => !!budgetsTitlesAndIds),
      takeUntil(this.destroy$),
    ).subscribe();

    this.currentDate.valueChanges.pipe(
      distinctUntilChanged((prev, curr) => isEqual(prev, curr)),
      takeUntil(this.destroy$),
    ).subscribe((date: Date) => {
      setTimeout(() => {
        this.store.dispatch(BudgetActions.loadSpendByDate({ date }));
        this.dayOfWeek$.next(moment(date).format('dddd'))
      });
    });

    this.setupSpendArray();
    
    // this.currentBudget$.pipe(
    //   distinctUntilChanged((prev, curr) => isEqual(prev, curr)),
    //   // distinctUntilChanged((prev: IBudget | null, curr: IBudget | null) => {
    //   //   // Return true if the previous and current IDs are the same, which will prevent the emission.
    //   //   // Also considers the case where both the previous and current budgets are null.
    //   //   return prev?.id === curr?.id;
    //   // }),
    //   takeUntil(this.destroy$),
    // ).subscribe((budget: IBudget | null) => {
    //   if (budget) {
    //     this.currentDate!.setValue(budget.dateStart.toDate());
    //     this.minCalendarDate = budget.dateStart.toDate();
    //     this.maxCalendarDate = budget.dateEnd.toDate();
    //   }
    // });
    this.currentBudget$.pipe(
      // Start with a null value to ensure pairwise has a previous value on the first emission
      startWith(null as IBudget | null),
      // Use pairwise to get both the previous and current values
      pairwise(),
      takeUntil(this.destroy$),
    ).subscribe(([prevBudget, currBudget]: [IBudget | null, IBudget | null]) => {
      // Update currentDate only if the ID has changed
      if (prevBudget?.id !== currBudget?.id && currBudget) {
        this.currentDate!.setValue(currBudget.dateStart.toDate());
        this.minCalendarDate = currBudget.dateStart.toDate();
        this.maxCalendarDate = currBudget.dateEnd.toDate();
      }
    });
  }
    
  public changeBudget(budgetId: string) {
    this.userId$.pipe(
      filter((userId: string | null): userId is string => !!userId),
      take(1),
      tap((userId: string) => {
        this.store.dispatch(BudgetActions.loadBudget({ userId, budgetId }));
      }),
    ).subscribe();
  }

  private setupSpendArray() {
    this.currentBudget$.pipe(
      // take(1),
      switchMap(budget => {
        if (budget) {
          this.expenses = budget.expenses;

          const balances = this.mapCategoryBalances(this.expenses);
          return this.currentSpend$.pipe(map(spendArray => ({ spendArray, balances })));
        } else {
          return EMPTY;
        }
      }),
      takeUntil(this.destroy$),
    ).subscribe(({ spendArray, balances }) => {
      this.spendArray.clear();
      spendArray.forEach(spend => this.addSpendToFormArray(spend, balances));
      // alert('rerender')
      if (this.table) this.table.renderRows();
    });
  }

  private mapCategoryBalances(expenses: IExpense[]): Map<string | null, number> {
    const balanceMap = new Map<string, number>();
    expenses.forEach(expense => balanceMap.set(expense.id, expense.balance));
    return balanceMap;
  }

  private addSpendToFormArray(spend: ISpend, balances: Map<string | null, number>) {
    const balance = balances.get(spend?.categoryId) || 0;
    const spendFormGroup = this.formBuilder.group({
      id: spend.id,
      title: spend.title,
      originalTitle: spend.title,
      amount: spend.amount,
      originalAmount: spend.amount,
      categoryId: spend.categoryId,
      originalCategory: spend.categoryId,
      balance: balance,
    });
    this.spendArray.push(spendFormGroup);
  }

  public getFormControl(name: string): AbstractControl {
    return this.spendFormGroup.get(name) as AbstractControl;
  }

  displayDaysDiff(dateStart: Timestamp, dateEnd: Timestamp): string {
    const startDate = moment(dateStart.toDate());
    const endDate = moment(dateEnd.toDate()).endOf('day');
    const formattedStartDate = startDate.format('MM/DD/YYYY');
    const formattedEndDate = endDate.format('MM/DD/YYYY');
    const daysDiff = this.budgetCalculatorService.countDaysDiff(dateStart, dateEnd);
  
    return `${formattedStartDate} - ${formattedEndDate} (${daysDiff} days)`;
  }
  
  public onBlurExpenseTitle(index: number) {
    const group = this.spendArray.at(index);
    if (group.get('title')!.value === group.get('originalTitle')!.value) return;
    
    this.store.dispatch(BudgetActions.updateSpendTitle({
      spendId: group.get('id')!.value, 
      newTitle: group.get('title')!.value 
    }));
  }
  
  public onBlurSpendAmount(index: number) {
    const group = this.spendArray.at(index);
    const spendId = group.get('id')!.value;
    const categoryId = group.get('categoryId')!.value;
    const newAmount = +group.get('amount')!.value;
    const oldAmount = +group.get('originalAmount')!.value;
    const balance = +group.get('balance')!.value;
  
    if (newAmount === oldAmount) {
      return;
    }

    if (balance + oldAmount - newAmount < 0) {
      group.get('amount')!.setValue(oldAmount);
      this.snackbarService.showError('balance is not enough');
      return;
    } 

    this.currentBudget$.pipe(
      filter((budget: IBudget | null): budget is IBudget => !!budget),
      map((budget: IBudget) => {
        const isValid = this.budgetCalculatorService.isExpenseAmountValid(budget, newAmount, oldAmount);
        if (isValid) {
          const currentExpense = this.expenses.find((expense: IExpense) => expense.id === categoryId);
          if (currentExpense) {
            this.store.dispatch(BudgetActions.updateSpendAmount( { spendId, amount: newAmount, payloadForNextAction: { categoryId, newAmount: currentExpense.amount, newBalance: balance + oldAmount - newAmount } }));
          }
        } else {          
          group.get('amount')!.setValue(oldAmount);
          this.snackbarService.showError('daily is negative');
        }
      }),
      take(1),
    ).subscribe();
  }

  public addNewSpend(): void {
    this.store.dispatch(BudgetActions.addSpend( { date: this.currentDate.value }));
  }

  public changeDateByBtn(direction: 'next' | 'prev') {
    const currentDate = moment(this.currentDate.value).startOf('day');
    const modifiedDate = direction === 'next' ? currentDate.clone().add(1, 'days') : currentDate.clone().subtract(1, 'days');
  
    if (this.isDateWithinScope(modifiedDate)) {
      this.currentDate.setValue(modifiedDate.toDate());
    } else {
      this.snackbarService.showError('Date is out of scope.');
    }
  }
  
  private isDateWithinScope(date: moment.Moment): boolean {
    const minDate = moment(this.minCalendarDate).startOf('day');
    const maxDate = moment(this.maxCalendarDate).startOf('day');
    return date.isSameOrAfter(minDate) && date.isSameOrBefore(maxDate);
  }

  public openConfirmDeleteDialog(spend: any) {
    this.matDialog.open(DeleteDialogComponent, {
      data: { title: spend.title }
    })
    .afterClosed()
    .pipe(
      filter(data => !!data),
      takeUntil(this.destroy$),
      tap(() => {
        const currentExpense = this.expenses.find((expense: IExpense) => expense.id === spend.categoryId);
        
        if (currentExpense) {
          this.store.dispatch(BudgetActions.deleteSpend({ spendId: spend.id, expenseId: currentExpense.id, newAmount: currentExpense.amount, newBalance: currentExpense.balance + spend.amount }));
        }
      }),
    ).subscribe();
  }

  public handleCategoryChange(index: number) {
    // WHEN YOU CHANGE CATEGORY YOU NEED TO COUNT ALL CATEGORY!!
    const group = this.spendArray.at(index);
    const spendId = group.get('id')!.value;;
    const newCategory = group.get('categoryId')!.value;
    const oldCategory = group.get('originalCategory')!.value;
    const amount = group.get('amount')!.value;
    // const oldAmount = group.get('originalAmount')!.value;
  
    if (newCategory === oldCategory) {
      return;
    }

    this.currentBudget$.pipe(
      take(1),
      map((budget) => {
        if (budget) {
          return budget.expenses; 
        } else {
          group.get('categoryId')!.setValue(oldCategory);
          this.snackbarService.showError('something went wrong');
          return EMPTY;
        }
      }),
      takeUntil(this.destroy$),
    ).subscribe((expenses: any) => {
      const newExpenseCategory = expenses.find((expense: any) => expense.id === newCategory);
      const oldExpenseCategory = expenses.find((expense: any) => expense.id === oldCategory);

      if (newExpenseCategory) {
        const balance = newExpenseCategory.balance;
        if (balance - amount < 0) {
          group.get('categoryId')!.setValue(oldCategory);
          this.snackbarService.showError('not enough balance');
        } else {
          const updates = [
            { expenseId: oldCategory, newBalance: oldExpenseCategory.balance + amount },
            { expenseId: newCategory, newBalance: newExpenseCategory.balance - amount },
          ];

          this.store.dispatch(BudgetActions.updateMultipleExpenseBalances({ updates }));

          this.store.dispatch(BudgetActions.updateSpendCategory({
            spendId,
            newCategory,
            amount,
          }));

        }
      } else {
        group.get('categoryId')!.setValue(oldCategory);
        this.snackbarService.showError('something went wrong');
      }
    });


  }


  identify(index: number, item: IBudgetTitleAndId){
    return item.id;
  }
  
  public onSubmit() {
    // if (this.expensesForm.invalid) {
      // this.expensesForm.markAllAsTouched();
      // return;
    // }
  }
}
