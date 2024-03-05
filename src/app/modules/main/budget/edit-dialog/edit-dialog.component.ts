import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Unsub } from 'src/app/core/classes/unsub';
import { IBudget } from 'src/app/shared/models/budget.interface';
import { FormHelpersService } from 'src/app/shared/services/form-helpers.service';
import { CURRENCY_LIST } from '../budget.constants';
import { BudgetCalculatorService } from 'src/app/shared/services/budget-calculator.service';
import { Timestamp } from '@angular/fire/firestore';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store';
import * as BudgetActions from '../../../../store/budget/budget.actions';

@Component({
  selector: 'app-edit-dialog',
  templateUrl: './edit-dialog.component.html',
  styleUrls: ['./edit-dialog.component.scss'],
})
export class EditDialogComponent extends Unsub implements OnInit {
  public editForm: FormGroup;
  protected readonly CURRENCY_LIST = CURRENCY_LIST;
  
  constructor(
    public formHelpersService: FormHelpersService,
    public budgetCalculatorService: BudgetCalculatorService,
    private formBuilder: FormBuilder,
    private matDialogRef: MatDialogRef<EditDialogComponent>,
    private snackbarService: SnackbarService,
    private store: Store<AppState>,
    @Inject(MAT_DIALOG_DATA) public data: IBudget,
  ) {
    super();

    this.editForm = this.formBuilder.group({
      title: [data.title || null, [Validators.required]],
      dateStart: [data.dateStart.toDate(), [Validators.required]],
      dateEnd: [data.dateEnd.toDate(), [Validators.required]],
      total: [data.total || null, [Validators.required]],
      currency: [data.currency || null, [Validators.required]],
    });
  }
    
  public ngOnInit() {}

  public getFormControl(name: string): AbstractControl {
    return this.editForm.get(name) as AbstractControl;
  }

  onSubmit() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const newTotal = this.getFormControl('total').value;
    const dateStartTimestamp = Timestamp.fromDate(this.getFormControl('dateStart').value);
    const dateEndTimestamp = Timestamp.fromDate(this.getFormControl('dateEnd').value);
    const newDaily = this.budgetCalculatorService.countNewDaily(newTotal, dateStartTimestamp, dateEndTimestamp, this.data.expenses);
    
    if (newDaily > 0) {
      this.store.dispatch(BudgetActions.updateBudget({ 
        budgetId: this.data.id, 
        budgetData: {
          ...this.editForm.value,
          dateStart: dateStartTimestamp,
          dateEnd: dateEndTimestamp,
          daily: newDaily,
        },
      }));

      this.store.dispatch(BudgetActions.updateDailyCategoryAmount());
      this.matDialogRef.close(true);
    } else {
      this.snackbarService.showError(`daily is negative: ${newDaily}`);
    }
  }
}

