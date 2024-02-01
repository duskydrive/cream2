import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, combineLatest, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { BudgetService } from 'src/app/shared/services/budget.service';
import * as BudgetActions from './budget.actions';
import * as UserActions from '../user/user.actions';
import * as UserSelectors from '../user/user.selectors';
import * as BudgetSelectors from '../budget/budget.selectors';
import * as SpinnerActions from '../spinner/spinner.actions';
import { Store } from '@ngrx/store';
import { IBudget, IExpense } from 'src/app/shared/models/budget.interface';
import { Router } from '@angular/router';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { FirebaseError } from '@angular/fire/app';
import { IBudgetTitleAndId } from 'src/app/core/models/interfaces';
import { moveItemInArray } from '@angular/cdk/drag-drop';

@Injectable()
export class BudgetEffects {
  constructor(
    private actions$: Actions,
    private budgetService: BudgetService,
    private store: Store,
    private router: Router,
    private snackbarService: SnackbarService,
  ) {}

  createBudget$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.createBudget),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      switchMap(({ userId, budgetData, expenses}) => 
        this.budgetService.createBudget(userId, budgetData, expenses).pipe(
          map((budget: IBudget) => {
            console.log(budget)
            this.snackbarService.showSuccess('budget_create_success');
            this.router.navigate(['/budget']);
            return BudgetActions.createBudgetSuccess( { budget });
          }),
          catchError((error: FirebaseError) => {
            this.snackbarService.showError(error.code || 'budget_load_error');
            return of(BudgetActions.createBudgetFailure( { error }));
          }),
        )
      ),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  triggerloadBudgetsTitlesAndIds$ = createEffect(() => 
    this.actions$.pipe(
      ofType(UserActions.setUser),
      map(({ user }) => {
        if (!user) {
          return BudgetActions.loadBudgetsTitlesAndIdsFailure({ error: 'User ID is not available' });
        }
        return BudgetActions.loadBudgetsTitlesAndIds({ userId: user.userId! });
      }),
    )
  );

  loadBudgetsTitlesAndIds$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.loadBudgetsTitlesAndIds),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      switchMap(({ userId }) => {
        if ( userId ) {
          return this.budgetService.getBudgetsTitlesAndIds(userId).pipe(
            map((budgetTitlesAndIds: IBudgetTitleAndId[]) => {  
              return BudgetActions.loadBudgetsTitlesAndIdsSuccess( { budgetTitlesAndIds });
            }),
            catchError((error: FirebaseError) => {
              this.snackbarService.showError(error.code || 'some_error');
              return of(BudgetActions.loadBudgetsTitlesAndIdsFailure( { error }));
            }),
          )
        } else {
          return of(BudgetActions.loadBudgetsTitlesAndIdsFailure( { error: 'No user found' }));
        }
      }),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  loadBudget$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.loadBudget),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      switchMap(({ userId, budgetId }) => {
        return this.budgetService.getBudget(userId, budgetId).pipe(
          map((budget: IBudget) => {  
            return BudgetActions.loadBudgetSuccess( { budget });
          }),
          catchError((error: FirebaseError) => {
            this.snackbarService.showError(error.code || 'some_error');
            return of(BudgetActions.loadBudgetFailure( { error }));
          }),
        )
      }),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  reorderItemsAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.reorderItemsAction),
      // tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      map(({ previousIndex, currentIndex, items }) => {
        const reorderedItems = [...items];
        moveItemInArray(reorderedItems, previousIndex, currentIndex);
        const reindexedExpenses = reorderedItems.map((expense, index) => ({
          ...expense,
          orderIndex: index
        }));

        if (reindexedExpenses) { 
          return BudgetActions.reorderItemsActionSuccess({ expenses: reindexedExpenses });
        } else {
          return BudgetActions.reorderItemsActionFailure({ error: 'some error' });
        }
      }),
      // tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  triggerSaveOrderToBackend$ = createEffect(() => 
  this.actions$.pipe(
    ofType(BudgetActions.reorderItemsActionSuccess),
    map((action) => {
      const userId = 'KZ1BusePAMXIBPP4foayZkg5Wun1'; // Replace with actual userId logic
      const budgetId = 'qrYN1r7lU6f9rli2j500'; // Replace with actual budgetId logic

      // Wrap the action in an observable
      return BudgetActions.changeExpensesOrder({ 
        userId: userId, 
        budgetId: budgetId, 
        expenses: action.expenses,
      });
    }),
  )
);


  saveExpensesOrderRemoteAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.changeExpensesOrder),
      switchMap(action => {
        // return of(BudgetActions.changeExpensesOrderFailure({ error: 'test' }))
        return this.budgetService.updateExpensesOrder(action.userId, action.budgetId, action.expenses).pipe(
          map((items) => {
            console.log('items:', items)
            return BudgetActions.changeExpensesOrderSuccess()
          }),
          catchError(error => {
            return of(BudgetActions.changeExpensesOrderFailure({ error }))
          })
        )
      }
      )
    )
  );

}