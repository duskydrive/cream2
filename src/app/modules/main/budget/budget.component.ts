import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store';
import * as BudgetActions from '../../../store/budget/budget.actions';
import * as BudgetSelectors from 'src/app/store/budget/budget.selectors';
import * as UserSelectors from 'src/app/store/user/user.selectors';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { FormHelpersService } from 'src/app/shared/services/form-helpers.service';
import { Unsub } from 'src/app/core/classes/unsub';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatTable } from '@angular/material/table';
import { IBudgetTitleAndId } from 'src/app/core/models/interfaces';
import { Observable, debounceTime, distinctUntilChanged, filter, finalize, first, map, of, switchMap, take, takeUntil } from 'rxjs';
import { IBudget, IExpense, IExpenseExtended } from 'src/app/shared/models/budget.interface';
import * as moment from 'moment';
import { Timestamp } from '@angular/fire/firestore';
import { isEqual } from 'lodash';
import { countCategorisedExpenses, countDaysDiff } from 'src/app/app.helpers';

@Component({
  selector: 'app-budget',
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss'],
})
export class BudgetComponent extends Unsub implements OnInit {
  public displayedColumns: string[] = ['items', 'amount', 'balance', 'action'];
  public currentBudget$: Observable<IBudget | null> = this.store.select(BudgetSelectors.selectCurrentBudget);
  public budgets$: Observable<IBudgetTitleAndId[] | null> = this.store.select(BudgetSelectors.selectBudgetsTitlesAndIds);
  private userId$: Observable<string | null> = this.store.select(UserSelectors.selectUserId);
  public dataSource: any[] = [];
  public isDragging = false;
  public dragDisabled = true;

  @ViewChild(MatTable) table!: MatTable<any>;

  constructor(
    public formHelpersService: FormHelpersService,
    private formBuilder: FormBuilder,
    private store: Store<AppState>,
    private snackbarService: SnackbarService,
  ) {
    super();
  }

  expensesFormGroup: FormGroup = this.formBuilder.group({
    expensesArray: this.formBuilder.array([]),
  });

  get expensesArray(): FormArray<FormGroup> {
    return this.expensesFormGroup.get('expensesArray') as FormArray;
  }
    
  public ngOnInit() {
    this.budgets$.pipe(
      filter((budgetsTitlesAndIds: IBudgetTitleAndId[] | null): budgetsTitlesAndIds is IBudgetTitleAndId[] => !!budgetsTitlesAndIds),
      takeUntil(this.destroy$),
    ).subscribe();
    
    this.currentBudget$.pipe(
      distinctUntilChanged((prev, curr) => isEqual(prev, curr)),
      takeUntil(this.destroy$),
    ).subscribe((budget: IBudget | null) => {
      this.expensesArray.clear();

      budget?.expenses.forEach((expense: IExpense) => {
        this.expensesArray.push(this.formBuilder.group({
          id: expense.id,
          title: expense.title,
          originalTitle: expense.title,
          amount: expense.amount,
          originalAmount: expense.amount,
          balance: [{value: expense.balance, disabled: true}],
          orderIndex: expense.orderIndex,
        }));
      });

      // TODO test when currentBudget is not null from the get go and maybe move this to afterViewInit
      if (this.table) {
        this.table.renderRows(); 
      }

      console.log('this.expensesArray.value', this.expensesArray.value)
    });
  }
    
  public changeBudget(budgetId: string) {
    this.userId$.pipe(
      filter((userId: string | null): userId is string => !!userId),
      takeUntil(this.destroy$),
    ).subscribe((userId: string) => {
      this.store.dispatch(BudgetActions.loadBudget({ userId, budgetId }));
    });
  }

  displayDaysDiff(dateStart: Timestamp, dateEnd: Timestamp): string {
    const startDate = moment(dateStart.toDate());
    const endDate = moment(dateEnd.toDate()).endOf('day');
    const formattedStartDate = startDate.format('MM/DD/YYYY');
    const formattedEndDate = endDate.format('MM/DD/YYYY');
    const daysDiff = countDaysDiff(dateStart, dateEnd);
  
    return `${formattedStartDate} - ${formattedEndDate} (${daysDiff} days)`;
  }
  
  public onBlurExpenseTitle(index: number) {
    const group = this.expensesArray.at(index);
    if (group.get('title')!.value === group.get('originalTitle')!.value) return;
    this.store.dispatch(BudgetActions.updateExpenseTitle({
      expenseId: group.get('id')!.value, 
      newTitle: group.get('title')!.value 
    }));
  }
  
  public onBlurExpenseAmount(index: number) {
    const group = this.expensesArray.at(index);
    const newAmount = +group.get('amount')!.value;
    const oldAmount = +group.get('originalAmount')!.value;
  
    if (newAmount === oldAmount) {
      return;
    }
  
    this.isAmountValid(newAmount, oldAmount).subscribe((isValid: boolean) => {
      if (isValid) {
        this.store.dispatch(BudgetActions.updateExpenseAmount({
          expenseId: group.get('id')!.value,
          newAmount,
          newBalance: newAmount - (oldAmount - group.get('balance')!.value),
        }));
      } else {
        group.get('amount')!.setValue(oldAmount);
        this.snackbarService.showError('daily is negative');
      }
    });
  }
  
  isAmountValid(newAmount: number, oldAmount: number) {
    return this.currentBudget$.pipe(
      distinctUntilChanged((prev, curr) => isEqual(prev, curr)),
      filter((budget: IBudget | null): budget is IBudget => !!budget),
      map((budget: IBudget) => {
        const plannedSpend = countCategorisedExpenses(budget.expenses);
        const daysDiff = countDaysDiff(budget.dateStart, budget.dateEnd);
        const newUncategorisedSpend = budget.total - plannedSpend + oldAmount - newAmount;
        const amountLeft = newUncategorisedSpend; // TODO later: add fact daily spends here (newUncatgorisedSpend - fact daily spends)
        const dailyWithUncategorisedSpend = amountLeft / daysDiff;
        if (dailyWithUncategorisedSpend > 1) {
          // TODO this should be in effects. probably put all thus shit in helper
          // const dailyWithoutUncategorisedSpend = newUncatgorisedSpend / daysDiff;
          // return dailyWithoutUncategorisedSpend;
          return true;
        }
        return false;
      }),
      take(1),
    );
  }

  drop(event: CdkDragDrop<any>) {
    this.dragDisabled = true;
    
    if (event.previousIndex !== event.currentIndex) {
      const preparedValues: IExpense[] = this.expensesArray.value.map(({ originalTitle, originalAmount, ...rest }) => rest);
      this.store.dispatch(BudgetActions.reorderItemsAction({ previousIndex: event.previousIndex, currentIndex: event.currentIndex, items: preparedValues }))
    }
  }
  
  dragStarted() {
    this.isDragging = true;
  }

  dragEnded() {
    this.isDragging = false;
  }
  
  public onSubmit() {
    // if (this.expensesForm.invalid) {
      // this.expensesForm.markAllAsTouched();
      // return;
    // }
  }
}
