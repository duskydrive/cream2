import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { BudgetService } from 'src/app/shared/services/budget.service';
import * as BudgetActions from './budget.actions';
import * as UserActions from '../user/user.actions';
import * as UserSelectors from '../user/user.selectors';
import * as BudgetSelectors from '../budget/budget.selectors';
import * as SpinnerActions from '../spinner/spinner.actions';
import { Store } from '@ngrx/store';
import { IBudget } from 'src/app/shared/models/budget.interface';
import { Router } from '@angular/router';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { FirebaseError } from '@angular/fire/app';
import { IBudgetTitleAndId } from 'src/app/core/models/interfaces';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { BudgetCalculatorService } from 'src/app/shared/services/budget-calculator.service';

@Injectable()
export class BudgetEffects {
  constructor(
    private actions$: Actions,
    private budgetService: BudgetService,
    private budgetCalculatorService: BudgetCalculatorService,
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

  updateBudget$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.updateBudget),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
      ),
      switchMap(( [{budgetId, budgetData}, userId]) => 
        this.budgetService.updateBudget(userId!, budgetId, budgetData).pipe(
          map(({budgetData}) => {
            return BudgetActions.updateBudgetSuccess( { budgetData });
          }),
          catchError((error: FirebaseError) => {
            this.snackbarService.showError(error.code || 'budget_update_error');
            return of(BudgetActions.updateBudgetFailure( { error }));
          }),
        )
      ),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  updateBudgetSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetActions.updateBudgetSuccess),
      withLatestFrom(this.store.select(BudgetSelectors.selectCurrentBudget)),
      filter(([action, currentBudget]) => {
        return !!currentBudget && 'title' in action.budgetData;
      }),
      map(([{ budgetData }, currentBudget]) => {
        const budgetId = currentBudget!.id;
        const newTitle = budgetData.title!;
        return BudgetActions.updateBudgetTitleInList({ budgetId, newTitle });
      })
    )
  );


  triggerLoadBudgetsTitlesAndIds$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.setUser, BudgetActions.createBudgetSuccess), // Listen for both actions
      withLatestFrom(this.store.select(UserSelectors.selectUserId)),
      switchMap(([, userId]) => {
        if (!userId) {
          // If we don't have a userId, return a failure action.
          return of(BudgetActions.loadBudgetsTitlesAndIdsFailure({ error: 'User ID is not available' }));
        }
        
        return of(BudgetActions.loadBudgetsTitlesAndIds({ userId }));
      }),
      catchError((error) => of(BudgetActions.loadBudgetsTitlesAndIdsFailure({ error })))
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
    )
  );

  triggerSaveOrderToBackend$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.reorderItemsActionSuccess),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudget)
      ),
      map(([action, userId, currentBudget]) => {
        if (!userId || !currentBudget) {
          return { type: '[Error] Missing User or Budget' };
        }

        const budgetId = currentBudget.id;

        return BudgetActions.changeExpensesOrder({ 
          userId, 
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
        return this.budgetService.updateExpensesOrder(action.userId, action.budgetId, action.expenses).pipe(
          map(() => BudgetActions.changeExpensesOrderSuccess()),
          catchError(error => {
            return of(BudgetActions.changeExpensesOrderFailure({ error }))
          })
        )
      }
      )
    )
  );

  updateExpenseTitleAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.updateExpenseTitle),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudget)
      ),
      switchMap(([ { expenseId, newTitle }, userId, budget ]) => {
        return this.budgetService.updateExpenseTitle(userId!, budget!.id, expenseId, newTitle).pipe(
          map(({ expenseId, newTitle }) => BudgetActions.updateExpenseTitleSuccess({ expenseId, newTitle })),
          catchError(error => {
            return of(BudgetActions.updateExpenseTitleFailure({ error }))
          })
        )
      }
      )
    )
  );

  updateExpenseAmountAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.updateExpenseAmount),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudget)
      ),
      switchMap(([ { expenseId, newAmount, newBalance }, userId, budget ]) => {
        return this.budgetService.updateExpenseAmount(userId!, budget!.id, expenseId, newAmount, newBalance).pipe(
          map(({ expenseId, newAmount, newBalance }) => BudgetActions.updateExpenseAmountSuccess({ expenseId, newAmount, newBalance })),
          catchError(error => {
            return of(BudgetActions.updateExpenseAmountFailure({ error }))
          })
        )
      }
      ),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  triggerUpdateBudgetAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.updateExpenseAmountSuccess, BudgetActions.deleteExpenseSuccess),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      withLatestFrom(
        this.store.select(BudgetSelectors.selectCurrentBudget)
      ),
      switchMap(([ expense, budget ]) => {
        const { total, dateStart, dateEnd, expenses } = budget!;
        const newDaily = this.budgetCalculatorService.countNewDaily(total, dateStart, dateEnd, expenses);

        return of(BudgetActions.updateBudget({ budgetId: budget!.id, budgetData: { daily: newDaily }}));
      }
      ),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  deleteExpenseAmountAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.deleteExpense),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudget)
      ),
      switchMap(([ { expenseId }, userId, budget ]) => {
        return this.budgetService.deleteExpense(userId!, budget!.id, expenseId).pipe(
          map(() => BudgetActions.deleteExpenseSuccess({ expenseId })),
          catchError(error => {
            console.log(error)
            return of(BudgetActions.deleteExpenseFailure({ error }))
          })
        )
      }
      ),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  addExpenseAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.addExpense),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudget)
      ),
      switchMap(([{}, userId, budget ]) => {
        return this.budgetService.addExpense(userId!, budget!.id).pipe(
          map((expense) => BudgetActions.addExpenseSuccess({ expense })),
          catchError(error => {
            return of(BudgetActions.addExpenseFailure({ error }))
          })
        )
      }
      )
    )
  );
}