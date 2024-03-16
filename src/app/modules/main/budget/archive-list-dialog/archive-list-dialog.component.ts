import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Unsub } from 'src/app/core/classes/unsub';
import { AppState } from 'src/app/store';
import * as BudgetActions from '../../../../store/budget/budget.actions';
import { Router } from '@angular/router';
import { IBudgetTitleAndId } from 'src/app/core/interfaces/interfaces';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-archive-list-dialog',
  templateUrl: './archive-list-dialog.component.html',
  styleUrls: ['./archive-list-dialog.component.scss'],
})
export class ArchiveListDialogComponent extends Unsub implements OnInit {
  budgetsForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>,
    private matDialogRef: MatDialogRef<ArchiveListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {budgets: IBudgetTitleAndId[]},
  ) {
    super();

    this.budgetsForm = this.fb.group({
      budget: [null, [Validators.required]],
    })
  }

  get budget() {
    return this.budgetsForm.get('budget') as AbstractControl;
  }
    
  public ngOnInit() {

  }

  restoreBudget() {  
    if (this.budgetsForm.invalid) {
      this.budgetsForm.markAllAsTouched();
      return;
    }

    this.store.dispatch(BudgetActions.updateBudget({ budgetId: this.budget.value, budgetData: { isArchived: false } }));

    this.matDialogRef.close();
  }
}
