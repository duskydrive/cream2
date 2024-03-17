import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, EMPTY, Observable, catchError, combineLatest, combineLatestWith, filter, map, switchMap, take, takeUntil, tap, throwError } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store';
import * as moment from 'moment';
import * as BudgetActions from '../../../store/budget/budget.actions';
import * as BudgetSelectors from 'src/app/store/budget/budget.selectors';
import * as UserSelectors from 'src/app/store/user/user.selectors';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { FormHelpersService } from 'src/app/shared/services/form-helpers.service';
import { Unsub } from 'src/app/core/classes/unsub';
import { CURRENCY_LIST } from './create-budget.constants';
import { prepareExpenses } from 'src/app/app.helpers';
import { IBudget, IExpense } from 'src/app/shared/models/budget.interface';
import { BudgetCalculatorService } from 'src/app/shared/services/budget-calculator.service';

@Component({
  selector: 'app-create-budget',
  templateUrl: './create-budget.component.html',
  styleUrls: ['./create-budget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class CreateBudgetComponent extends Unsub implements OnInit, OnDestroy {
  public budgetForm: FormGroup;
  public expensesForm: FormGroup;
  public copiedBudget$: Observable<IBudget | null> = this.store.select(BudgetSelectors.copiedBudget);
  public totalDays$ = new BehaviorSubject<number>(1);
  public categorisedExpenses$ = new BehaviorSubject<number>(0);
  public daily$ = new BehaviorSubject<number>(0);
  protected readonly CURRENCY_LIST = CURRENCY_LIST;
  
  constructor(
    public formHelpersService: FormHelpersService,
    public budgetCalculatorService: BudgetCalculatorService,
    private formBuilder: FormBuilder,
    private store: Store<AppState>,
    private snackbarService: SnackbarService,
  ) {
    super();

    this.budgetForm = this.formBuilder.group({
      title: [null, [Validators.required]],
      dateStart: [new Date(), [Validators.required]],
      dateEnd: [new Date(), [Validators.required]],
      total: [null, [Validators.required, Validators.min(1)]],
      currency: ['USD', [Validators.required]],
    });

    this.expensesForm = this.formBuilder.group({
      expenses: this.formBuilder.array([]),
    });
  }

  get expensesArray(): FormArray {
    return this.expensesForm.get('expenses') as FormArray;
  }

  public ngOnInit() {
    this.calculateDailyBudget();

    this.copiedBudget$.pipe(
      takeUntil(this.destroy$),
    ).subscribe((budget: IBudget | null) => {
      if (budget) {
        this.fillFormWithCopiedBudget(budget);
      } else {
        this.addRows(3);
      }
    }); 
  }

  override ngOnDestroy(): void {
    this.copiedBudget$.pipe(
      takeUntil(this.destroy$),
    ).subscribe((budget: IBudget | null) => {
      if (budget) {
        this.store.dispatch(BudgetActions.resetCopiedBudget());
      } 
    }); 
    
    super.ngOnDestroy();
  }

  fillFormWithCopiedBudget(budget: IBudget) {
    this.budgetForm.patchValue({
      title: budget.title,
      total: budget.total,
      currency: budget.currency,
      dateStart: budget.dateStart.toDate(),
      dateEnd: budget.dateEnd.toDate(),
    });

    this.expensesArray.clear();

    budget.expenses.forEach((expense: IExpense) => {
      if (expense.title !== 'Daily') { 
        const copiedItem = this.createExpenseItem(expense.title, expense.amount);
        this.expensesArray.push( copiedItem );
       };
    });
  
    this.totalDays$.next( this.budgetCalculatorService.countDaysDiff(budget.dateStart, budget.dateEnd) );
    this.categorisedExpenses$.next( this.budgetCalculatorService.countCategorisedExpenses(this.expensesArray.value) );
  }

  public addExpenseItem(item: any) {
    this.expensesArray.push( item );
  }

  public addRows(times: number) {
    let count = 0;
    while (count < times && count < 10) {
      this.addExpenseItem( this.createExpenseItem() );
      count++;
    }
  }

  private calculateDailyBudget() {
    combineLatest([
      this.totalDays$,
      this.getFormControl('total').valueChanges,
      this.categorisedExpenses$,
    ]).pipe(
      map(([days, total, expenses]) => {
        const uncategorisedExpenses = total - expenses;
        return Math.floor(uncategorisedExpenses / days);
      }),
      takeUntil(this.destroy$)
    ).subscribe(daily => {
      this.daily$.next(daily);
    });
  }
  
  public getFormControl(name: string): AbstractControl {
    return this.budgetForm.get(name) as AbstractControl;
  }

  public getFormControlFromArray(index: number, name: string): AbstractControl {
    const group = this.expensesArray.at(index) as FormGroup;
    return group.get(name) as AbstractControl;
  }

  private createExpenseItem(title?: string, amount?: number): FormGroup {
    return this.formBuilder.group({
      title: [title || null, [Validators.required]],
      amount: [amount || null, [Validators.required, Validators.min(1)]],
    });
  }

  public removeExpenseItem(index: number) {
    this.expensesArray.removeAt(index);
    this.onAmountChange();
  }

  public onDateChange(startValue: string, endValue: string) {
    if (startValue && endValue) {
      const startDate = moment(startValue, 'M/D/YYYY');
      const endDate = moment(endValue, 'M/D/YYYY');

      this.totalDays$.next(endDate.diff(startDate, 'days') + 1);
    }
  }

  public onAmountChange() {
    const total = this.expensesArray.controls.reduce((acc: number, current: AbstractControl) => {
      return acc + current.value.amount;
    }, 0);
    this.categorisedExpenses$.next(total);
  }

  public drop(event: CdkDragDrop<FormGroup[]>) {
    const fromIndex = event.previousIndex;
    const toIndex = event.currentIndex;
    const item = this.expensesArray.at(fromIndex);
    this.expensesArray.removeAt(fromIndex);
    this.expensesArray.insert(toIndex, item);
  }

  public createBudget() {
    if (this.expensesForm.invalid) {
      this.expensesForm.markAllAsTouched();
      return;
    }
    
    const currentDaily = this.daily$.getValue();

    this.categorisedExpenses$.pipe(
      switchMap((value: any) => {
        if (value === 0) {
          this.snackbarService.showError('add_expenses');
          return throwError(() => new Error('No expenses'));
        } else if (currentDaily < 1) {
          this.snackbarService.showError('daily_error');
          return throwError(() => new Error('Invalid daily amount'));
        }
        return this.store.select(UserSelectors.selectUserId).pipe(
          combineLatestWith(this.categorisedExpenses$)
        );
      }),
      filter(([userId, categorisedExpenses]) => !!userId && categorisedExpenses !== undefined),
      take(1),
      catchError(error => {
        return EMPTY;
      })
    ).subscribe(([userId, categorisedExpenses]) => {
      const uncategorisedExpenses = +this.getFormControl('total').value - categorisedExpenses;
      const expenses = prepareExpenses([...this.expensesArray.value, {title: 'Daily', amount: uncategorisedExpenses}]);
      
      const budgetData: Omit<IBudget, 'id' | 'expenses'> = {
        title: this.getFormControl('title').value,
        dateStart: Timestamp.fromDate(this.getFormControl('dateStart').value),
        dateEnd: Timestamp.fromDate(this.getFormControl('dateEnd').value),
        currency: this.getFormControl('currency').value,
        daily: currentDaily,
        total: this.getFormControl('total').value,
        isArchived: false,
      };

      this.store.dispatch(BudgetActions.createBudget({ userId: userId!, budgetData, expenses }));
    });
}
}