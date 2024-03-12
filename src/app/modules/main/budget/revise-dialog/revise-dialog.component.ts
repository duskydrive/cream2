import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Unsub } from 'src/app/core/classes/unsub';
import { IExpense } from 'src/app/shared/models/budget.interface';
import { FormHelpersService } from 'src/app/shared/services/form-helpers.service';
import { BudgetCalculatorService } from 'src/app/shared/services/budget-calculator.service';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store';
import { BudgetService } from 'src/app/shared/services/budget.service';
import * as BudgetActions from '../../../../store/budget/budget.actions';

@Component({
  selector: 'app-revise-dialog',
  templateUrl: './revise-dialog.component.html',
  styleUrls: ['./revise-dialog.component.scss'],
})
export class ReviseDialogComponent extends Unsub implements OnInit {
  public reviseForm: FormGroup;
  private budgetDiff = 0;
  public msg = '';
  public isDisabled = true;
  
  constructor(
    public formHelpersService: FormHelpersService,
    public budgetCalculatorService: BudgetCalculatorService,
    public budgetService: BudgetService,
    private formBuilder: FormBuilder,
    private matDialogRef: MatDialogRef<ReviseDialogComponent>,
    private store: Store<AppState>,
    @Inject(MAT_DIALOG_DATA) public data: { expenses: IExpense[]},
  ) {
    super();

    this.reviseForm = this.formBuilder.group({
      amount: [null, [Validators.required]],
    });
  }
    
  public ngOnInit() {}

  public getFormControl(name: string): AbstractControl {
    return this.reviseForm.get(name) as AbstractControl;
  }

  compareBalances(factBalance: string) {
    if (this.reviseForm.invalid) {
      this.reviseForm.markAllAsTouched();
      return;
    }

    const budgetBalance = this.data.expenses.reduce((acc, cur) => {
      return acc + cur.balance;
    }, 0);

    this.budgetDiff = +factBalance - budgetBalance;

    if (this.budgetDiff > 0) {
      this.msg = `You have ${this.budgetDiff} USD more then in budget!`;
      this.isDisabled = false;
    } else if (this.budgetDiff < 0) {
      this.msg = `You have ${this.budgetDiff} USD less then in budget!`;
      this.isDisabled = false;
    } else {
      this.msg = `Your balance and budget are the same`;
      this.isDisabled = true;
    }
  }

  fix() {
    if (this.budgetDiff !== 0) {
      this.store.dispatch(BudgetActions.addFix({ amount: this.budgetDiff }));
      this.matDialogRef.close(true);
    }
  }
}

