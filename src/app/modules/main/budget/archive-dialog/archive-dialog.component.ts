import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Unsub } from 'src/app/core/classes/unsub';
import { AppState } from 'src/app/store';
import * as BudgetActions from '../../../../store/budget/budget.actions';
import { Router } from '@angular/router';

@Component({
  selector: 'app-archive-dialog',
  templateUrl: './archive-dialog.component.html',
  styleUrls: ['./archive-dialog.component.scss'],
})
export class ArchiveDialogComponent extends Unsub implements OnInit {
  constructor(
    private matDialogRef: MatDialogRef<ArchiveDialogComponent>,
    private store: Store<AppState>,
    @Inject(MAT_DIALOG_DATA) public data: {id: string, title: string},
  ) {
    super();
  }
    
  public ngOnInit() {

  }

  public onSubmit() {  
    this.store.dispatch(BudgetActions.updateBudget({ budgetId: this.data.id, budgetData: { isArchived: true } }));
    this.matDialogRef.close();
  }
}
