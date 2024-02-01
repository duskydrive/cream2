import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder } from '@angular/forms';
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
import { debounceTime, distinctUntilChanged, filter, take, takeUntil } from 'rxjs';
import { IBudget } from 'src/app/shared/models/budget.interface';
import * as moment from 'moment';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-budget',
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss'],
})
export class BudgetComponent extends Unsub implements OnInit {
  public displayedColumns: string[] = ['items', 'amount', 'balance', 'action'];
  public currentBudget: IBudget | null = null;
  public budgets: IBudgetTitleAndId[] = [];
  public dataSource: any[] = [];
  isDragging = false;

  @ViewChild(MatTable) table!: MatTable<any>;
  dragDisabled = true;

  drop(event: CdkDragDrop<any>) {
    // Return the drag container to disabled.
    this.dragDisabled = true;


    // moveItemInArray(this.dataSource, previousIndex, event.currentIndex);
    // this.table.renderRows();

    if (event.previousIndex !== event.currentIndex) {
      this.store.dispatch(BudgetActions.reorderItemsAction({ previousIndex: event.previousIndex, currentIndex: event.currentIndex, items: this.dataSource }))
    }

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
      alert('ngOnInit BudgetSelectors.selectBudgetsTitlesAndIds')
      this.budgets = budgetsTitlesAndIds;
    });

    this.store.select(BudgetSelectors.selectCurrentBudget).pipe(
      distinctUntilChanged(),
      // debounceTime(300),
      takeUntil(this.destroy$),
    ).subscribe((budget: IBudget | null) => {
      alert('ngOnInit BudgetSelectors.selectCurrentBudget')
      // console.log('budget', budget)
      this.currentBudget = budget;
      // if (this.currentBudget) this.dataSource = this.currentBudget.expenses;
    });
  }

  public changeBudget(budgetId: string) {
    this.store.select(UserSelectors.selectUserId).pipe(
      filter((userId: string | null): userId is string => !!userId),
      takeUntil(this.destroy$),
    ).subscribe((userId: string) => {
      alert('ngOnInit UserSelectors.selectUserId (inside change budget)')
      this.store.dispatch(BudgetActions.loadBudget({ userId, budgetId }));
    });
  }

  public formatDates(dateStart: Timestamp, dateEnd: Timestamp): string {
    const startDate = moment(dateStart.toDate());
    const endDate = moment(dateEnd.toDate());
  
    const formattedStartDate = startDate.format('MM/DD/YYYY');
    const formattedEndDate = endDate.format('MM/DD/YYYY');
  
    const daysDiff = endDate.diff(startDate, 'days') + 1;
  
    return `${formattedStartDate} - ${formattedEndDate} (${daysDiff} days)`;
  }

  public onBlur() {
    // alert('blurred')
  }

  // dropTable(event: CdkDragDrop<any[]>) {
  //   if (event.previousIndex !== event.currentIndex) {
  //     // this.store.dispatch(new ReorderItemsAction({ previousIndex: event.previousIndex, currentIndex: event.currentIndex }));
  //     this.store.dispatch(BudgetActions.reorderItemsAction({ previousIndex: event.previousIndex, currentIndex: event.currentIndex, items: this.dataSource }))
  //   }
  //   // const prevIndex = this.dataSource.findIndex((d) => d === event!.item.data);
  //   // console.log(moveItemInArray(this.dataSource, prevIndex, event!.currentIndex))
  //   // moveItemInArray(this.dataSource, prevIndex, event!.currentIndex);
  //   // this.table.renderRows();

  //   // this.store.select(UserSelectors.selectUserId).pipe(
  //     // filter((userId: string | null): userId is string => !!userId),
  //     // takeUntil(this.destroy$),
  //   // ).subscribe((userId: string) => {
  //     // this.store.dispatch(BudgetActions.changeExpensesOrder({ userId, budgetId: this.currentBudget?.id!, expenses:  }))
  //   // });
    
    
  // }

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
