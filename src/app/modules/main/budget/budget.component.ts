import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store';
import * as BudgetActions from '../../../store/budget/budget.actions';
import * as BudgetSelectors from 'src/app/store/budget/budget.selectors';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { FormHelpersService } from 'src/app/shared/services/form-helpers.service';
import { Unsub } from 'src/app/core/classes/unsub';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatTable } from '@angular/material/table';
import { IBudgetTitleAndId } from 'src/app/core/models/interfaces';
import { filter, take, takeUntil } from 'rxjs';

@Component({
  selector: 'app-budget',
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss'],
})
export class BudgetComponent extends Unsub implements OnInit {
  public displayedColumns: string[] = ['items', 'amount', 'balance', 'action'];
  public budgets: IBudgetTitleAndId[] = [];
  public dataSource: any[] = [
    {
      title: 'Groceries',
      amount: 3000,
      balance: 3000,
    },
    {
      title: 'Gas',
      amount: 300,
      balance: 300,
    },
    {
      title: 'Rent',
      amount: 3500,
      balance: 3500,
    },
    {
      title: 'Gym',
      amount: 450,
      balance: 4500,
    },
  ];
  isDragging = false;

  @ViewChild(MatTable) table!: MatTable<any>;
  dragDisabled = true;

  drop(event: CdkDragDrop<any>) {
    // Return the drag container to disabled.
    this.dragDisabled = true;

    const previousIndex = this.dataSource.findIndex((d) => d === event.item.data);

    moveItemInArray(this.dataSource, previousIndex, event.currentIndex);
    this.table.renderRows();

  }

  constructor(
    public formHelpersService: FormHelpersService,
    private formBuilder: FormBuilder,
    private store: Store<AppState>,
    private snackbarService: SnackbarService,
  ) {
    super();

  }

  public ngOnInit() {
    this.store.select(BudgetSelectors.selectBudgetsTitlesAndIds).pipe(
      filter((budgetsTitlesAndIds: IBudgetTitleAndId[] | null): budgetsTitlesAndIds is IBudgetTitleAndId[] => !!budgetsTitlesAndIds),
      takeUntil(this.destroy$),
    ).subscribe((budgetsTitlesAndIds: IBudgetTitleAndId[]) => {
      this.budgets = budgetsTitlesAndIds;
    });
  }

  public onBlur() {
    alert('blurred')
  }

  dropTable(event?: CdkDragDrop<any[]>) {
    const prevIndex = this.dataSource.findIndex((d) => d === event!.item.data);
    moveItemInArray(this.dataSource, prevIndex, event!.currentIndex);
    this.table.renderRows();
  }

  dragStarted() {
    this.isDragging = true;
  }

  dragEnded() {
    this.isDragging = false;
  }
  

  // public getFormControl(name: string): AbstractControl {
    // return this.budgetForm.get(name) as AbstractControl;
  // }

  public onSubmit() {
    // if (this.expensesForm.invalid) {
      // this.expensesForm.markAllAsTouched();
      // return;
    // }
  }
}
