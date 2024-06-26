import { AfterViewChecked, ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
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
import { IBudgetTitleAndId } from 'src/app/core/interfaces/interfaces';
import { EMPTY, Observable, distinctUntilChanged, filter, map, switchMap, take, takeUntil, tap} from 'rxjs';
import { IBudget, IExpense } from 'src/app/shared/interfaces/budget.interface';
import * as moment from 'moment';
import { Timestamp } from '@angular/fire/firestore';
import { isEqual } from 'lodash';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';
import { EditDialogComponent } from './edit-dialog/edit-dialog.component';
import { BudgetCalculatorService } from 'src/app/shared/services/budget-calculator.service';
import { Router } from '@angular/router';
import { ReviseDialogComponent } from './revise-dialog/revise-dialog.component';
import { ArchiveDialogComponent } from './archive-dialog/archive-dialog.component';
import { ArchiveListDialogComponent } from './archive-list-dialog/archive-list-dialog.component';
import { BudgetService } from 'src/app/shared/services/budget.service';
import { TranslateService } from '@ngx-translate/core';
import { nullToZero } from 'src/app/app.helpers';

@Component({
  selector: 'app-budget',
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetComponent extends Unsub implements OnInit {
  public displayedColumns: string[] = ['items', 'amount', 'balance', 'action'];
  public currentBudget$: Observable<IBudget | null> = this.store.select(BudgetSelectors.selectCurrentBudget);
  public currentBudgetId$: Observable<string | undefined> = this.store.select(BudgetSelectors.selectCurrentBudgetId);
  public budgets$: Observable<IBudgetTitleAndId[] | null> = this.store.select(BudgetSelectors.selectBudgetsTitlesAndIds);
  public dataSource: any[] = [];
  public isDragging = false;
  public dragDisabled = true;
  private userId$: Observable<string | null> = this.store.select(UserSelectors.selectUserId);

  @ViewChild(MatTable) table!: MatTable<any>;

  constructor(
    public formHelpersService: FormHelpersService,
    public budgetCalculatorService: BudgetCalculatorService,
    public translateService: TranslateService,
    public budgetService: BudgetService,
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
    this.currentBudget$.pipe(
      distinctUntilChanged((prev, curr) => isEqual(prev, curr)),
      takeUntil(this.destroy$),
    ).subscribe((budget: IBudget | null) => {
      this.expensesArray.clear();

      if (budget) {
        budget.expenses.forEach((expense: IExpense) => {
          const expenseAmount = expense.amount === 0 ? null : expense.amount;

          this.expensesArray.push(this.formBuilder.group({
            id: expense.id,
            title: expense.title,
            originalTitle: expense.title,
            amount: expenseAmount,
            originalAmount: expenseAmount,
            balance: expense.balance,
            orderIndex: expense.orderIndex,
          }));
        });
      }

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

  public displayDaysDiff(dateStart: Timestamp, dateEnd: Timestamp): string {
    const startDate = moment(dateStart.toDate());
    const endDate = moment(dateEnd.toDate()).endOf('day');
    const formattedStartDate = startDate.format('MM/DD/YYYY');
    const formattedEndDate = endDate.format('MM/DD/YYYY');
    const daysDiff = this.budgetCalculatorService.countDaysDiff(dateStart, dateEnd);
  
    return `${formattedStartDate} - ${formattedEndDate} (${daysDiff} ` + this.translateService.instant('days') + `)`;
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
    const newAmount = nullToZero(+group.get('amount')!.value);
    let oldAmount: number | null = nullToZero(+group.get('originalAmount')!.value);
  
    if (newAmount === oldAmount) {
      return;
    }

    this.currentBudget$.pipe(
      filter((budget: IBudget | null): budget is IBudget => !!budget),
      map((budget: IBudget) => {
        const isValid = this.budgetCalculatorService.isExpenseAmountValid(budget, newAmount, oldAmount!);
        if (isValid) {
          this.store.dispatch(BudgetActions.updateExpenseAmount({
            expenseId: group.get('id')!.value,
            newAmount,
            newBalance: newAmount - (oldAmount! - group.get('balance')!.value),
          }));
        } else {
          if (oldAmount === 0) {
            oldAmount = null;
          }
          group.get('amount')!.setValue(oldAmount);
          this.snackbarService.showError('daily is negative');
        }
      }),
      take(1),
    ).subscribe();
  }

  public openEditDialog() {
    return this.currentBudget$.pipe(
      switchMap((budget: IBudget | null) => this.matDialog.open(EditDialogComponent, {
        data: {
          ...budget,
        }
      }).afterClosed()),
      take(1),
    ).subscribe();
  }

  public openReviseDialog() {
    return this.currentBudget$.pipe(
      switchMap((budget: IBudget | null) => this.matDialog.open(ReviseDialogComponent, {
        data: {
          expenses: budget?.expenses,
        }
      }).afterClosed()),
      take(1),
    ).subscribe();
  }

  public openArchiveDialog() {
    return this.currentBudget$.pipe(
      switchMap((budget: IBudget | null) => {
        if (budget) {
          return this.matDialog.open(ArchiveDialogComponent, {
            data: {
              id: budget?.id,
              title: budget?.title,
            }
          }).afterClosed()
        }
        return EMPTY;
      }),
      take(1),
    ).subscribe();
  }

  public openArchiveListDialog() {
    return this.userId$.pipe(
      switchMap((userId: string | null) => {
        if (userId) {
          return this.budgetService.getBudgetsTitlesAndIds(userId, true);
        }
        return EMPTY;
      }),
      switchMap((budgets: IBudgetTitleAndId[]) => this.matDialog.open(ArchiveListDialogComponent, {
        data: {
          budgets,
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

  public drop(event: CdkDragDrop<any>) {
    this.dragDisabled = true;
    
    if (event.previousIndex !== event.currentIndex) {
      const preparedValues: IExpense[] = this.expensesArray.value.map(({ originalTitle, originalAmount, ...rest }) => rest);
      this.store.dispatch(BudgetActions.reorderItemsAction({ previousIndex: event.previousIndex, currentIndex: event.currentIndex, items: preparedValues }))
    }
  }
  
  public dragStarted() {
    this.isDragging = true;
  }

  public dragEnded() {
    this.isDragging = false;
  }

  public identify(index: number, item: IBudgetTitleAndId){
    return item.id;
  }
}
