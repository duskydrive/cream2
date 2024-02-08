import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, filter, map, take, takeUntil } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import * as moment from 'moment';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store';
import * as BudgetActions from '../../../store/budget/budget.actions';
import * as UserSelectors from 'src/app/store/user/user.selectors';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { FormHelpersService } from 'src/app/shared/services/form-helpers.service';
import { Unsub } from 'src/app/core/classes/unsub';
import { CURRENCY_LIST } from './create-budget.constants';
import { IBudgetPayload } from 'src/app/shared/models/budget.interface';
import { prepareExpenses } from 'src/app/app.helpers';

@Component({
  selector: 'app-create-budget',
  templateUrl: './create-budget.component.html',
  styleUrls: ['./create-budget.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CreateBudgetComponent extends Unsub implements OnInit {
  public budgetForm: FormGroup;
  public expensesForm: FormGroup;
  public totalDays$ = new BehaviorSubject<number>(1);
  // TODO change to categorised expenses
  public plannedExpenses$ = new BehaviorSubject<number>(0);
  public daily$ = new BehaviorSubject<number>(0);
  // public uncategorisedExpenses$ = new BehaviorSubject<number>(0);
  protected readonly CURRENCY_LIST = CURRENCY_LIST;
  
  constructor(
    public formHelpersService: FormHelpersService,
    private formBuilder: FormBuilder,
    private store: Store<AppState>,
    private snackbarService: SnackbarService,
  ) {
    super();

    this.budgetForm = this.formBuilder.group({
      title: [null, [Validators.required]],
      dateStart: [new Date(), [Validators.required]],
      dateEnd: [new Date(), [Validators.required]],
      total: [null, [Validators.required]],
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
    this.addExpenseItem(3);
    this.calculateDailyBudget();
  }

  private calculateDailyBudget() {
    combineLatest([
      this.totalDays$,
      this.getFormControl('total').valueChanges,
      this.plannedExpenses$,
    ]).pipe(
      map(([days, total, expenses]) => {
        const uncategorisedExpenses = total - expenses;
        // this.uncategorisedExpenses$.next(uncategorisedExpenses);
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

  public addExpenseItem(times: number) {
    let count = 0;
    while (count < times && count < 10) {
      this.expensesArray.push(this.createExpenseItem());
      count++;
    }
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
    this.plannedExpenses$.next(total);
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
  
    if (currentDaily < 1) {
      this.snackbarService.showError('daily_error');
      return;
    };
      
    this.store.select(UserSelectors.selectUserId).pipe(
      filter((userId: string | null): userId is string => !!userId), // Ensure we have a non-null user ID
      take(1),
      takeUntil(this.destroy$),
    ).subscribe((userId) => {
      // const uncategorisedExpenses = this.uncategorisedExpenses$.value;
      // const dailyExpenses =  this.createExpenseItem('Daily', uncategorisedExpenses).value;
      const expenses = prepareExpenses([...this.expensesArray.value]);
      
      const budgetData: IBudgetPayload = {
        title: this.getFormControl('title').value,
        dateStart: Timestamp.fromDate( this.getFormControl('dateStart').value ),
        dateEnd: Timestamp.fromDate( this.getFormControl('dateEnd').value ),
        currency: this.getFormControl('currency').value,
        daily: currentDaily,
        total: this.getFormControl('total').value,
      };

      this.store.dispatch(BudgetActions.createBudget({ userId, budgetData, expenses }));
    });
  }
}