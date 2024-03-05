import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { Observable, distinctUntilChanged, filter, map, switchMap, take, takeUntil, tap} from 'rxjs';
import { IBudget, IExpense } from 'src/app/shared/models/budget.interface';
import * as moment from 'moment';
import { Timestamp } from '@angular/fire/firestore';
import { isEqual } from 'lodash';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';
import { EditDialogComponent } from './edit-dialog/edit-dialog.component';
import { BudgetCalculatorService } from 'src/app/shared/services/budget-calculator.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-budget',
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss'],
})
export class BudgetComponent extends Unsub implements OnInit {
  public displayedColumns: string[] = ['items', 'amount', 'balance', 'action'];
  public currentBudget$: Observable<IBudget | null> = this.store.select(BudgetSelectors.selectCurrentBudget);
  public currentBudgetId$: Observable<string | undefined> = this.store.select(BudgetSelectors.selectCurrentBudgetId);
  public budgets$: Observable<IBudgetTitleAndId[] | null> = this.store.select(BudgetSelectors.selectBudgetsTitlesAndIds);
  private userId$: Observable<string | null> = this.store.select(UserSelectors.selectUserId);
  public dataSource: any[] = [];
  public isDragging = false;
  public dragDisabled = true;

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
          balance: expense.balance,
          orderIndex: expense.orderIndex,
        }));
      });

      if (this.table) {
        this.table.renderRows(); 
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

  public openConfirmDeleteDialog(expenseId: string, title: string) {
    this.matDialog.open(DeleteDialogComponent, {
      data: { title }
    })
    .afterClosed()
    .pipe(
      filter(data => !!data),
      takeUntil(this.destroy$),
      tap(() => {
        this.store.dispatch(BudgetActions.deleteExpense({ expenseId }));
      }),
    ).subscribe();
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

    this.currentBudget$.pipe(
      filter((budget: IBudget | null): budget is IBudget => !!budget),
      map((budget: IBudget) => {
        const isValid = this.budgetCalculatorService.isExpenseAmountValid(budget, newAmount, oldAmount);
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
      }),
      take(1),
    ).subscribe();
  }

  openEditDialog() {
    return this.currentBudget$.pipe(
      switchMap((budget: IBudget | null) => this.matDialog.open(EditDialogComponent, {
        data: {
          ...budget,
        }
      }).afterClosed()),
      take(1),
    ).subscribe();
  }

  public copyBudget() {
    this.currentBudget$.pipe(
      filter((budget: IBudget | null): budget is IBudget => !!budget),
      take(1),
    ).subscribe((budget: IBudget) => {
      this.store.dispatch(BudgetActions.copyBudget({ budget }));
      this.router.navigate(['/create']);
    });
  }

  public addNewExpense(): void {
    this.store.dispatch(BudgetActions.addExpense());
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
