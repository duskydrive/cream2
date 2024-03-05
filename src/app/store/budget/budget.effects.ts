import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, Observable, catchError, concatAll, concatMap, filter, finalize, forkJoin, from, map, mergeMap, of, switchMap, tap, toArray, withLatestFrom } from 'rxjs';
import { BudgetService } from 'src/app/shared/services/budget.service';
import * as BudgetActions from './budget.actions';
import * as UserActions from '../user/user.actions';
import * as UserSelectors from '../user/user.selectors';
import * as BudgetSelectors from '../budget/budget.selectors';
import * as SpinnerActions from '../spinner/spinner.actions';
import { Action, Store } from '@ngrx/store';
import { IBudget, IExpense, ISpend } from 'src/app/shared/models/budget.interface';
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
      switchMap(([{ budgetData }, currentBudget]) => {
        if (!currentBudget) return EMPTY;

        const actionsToDispatch: Observable<Action>[] = [];
        const budgetId = currentBudget.id;

        if ('title' in budgetData) {
            const newTitle = budgetData.title!;
            actionsToDispatch.push(of(BudgetActions.updateBudgetTitleInList({ budgetId, newTitle })));
        }

        if ('total' in budgetData) {
            actionsToDispatch.push(of(BudgetActions.updateDailyCategoryAmount()));
        }

        return from(actionsToDispatch).pipe(concatAll());
      }),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  triggerLoadBudgetsTitlesAndIds$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.setUser, BudgetActions.createBudgetSuccess),
      withLatestFrom(this.store.select(UserSelectors.selectUserId)),
      switchMap(([, userId]) => {
        if (!userId) {
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

  loadSpendByDate$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.loadSpendByDate),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudgetId),
      ),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      switchMap(([date, userId, budgetId]) => {
        return this.budgetService.getSpendByDate(userId!, budgetId!, date.date).pipe(
          map((spend: ISpend[]) => {  
            return BudgetActions.loadSpendByDateSuccess( { spend });
          }),
          catchError((error: FirebaseError) => {
            console.log('aha: ', error)
            this.snackbarService.showError(error.code || 'some_error');
            return of(BudgetActions.loadSpendByDateFailure( { error }));
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
      ofType(BudgetActions.updateExpenseAmount, BudgetActions.deleteSpendSuccess),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudget)
      ),
      switchMap(([ { expenseId, newAmount, newBalance }, userId, budget ]) => {
        return this.budgetService.updateExpenseAmount(userId!, budget!.id, expenseId, newAmount, newBalance)
          .pipe(
            map(( updatedExpense ) => BudgetActions.updateExpenseAmountSuccess({ updatedExpense })),
            catchError(error => {
              return of(BudgetActions.updateExpenseAmountFailure({ error }))
            }),
          )
        }
      ),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );


  triggerUpdateDailyCategoryAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.updateExpenseAmountSuccess, BudgetActions.deleteExpenseSuccess, BudgetActions.updateDailyCategoryAmount),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudget),
      ),
      switchMap(( [ {}, userId, budget ] ) => {
        const updatedDailyCategory = this.budgetCalculatorService.getUpdatedUncategorisedExpenses(budget!.total, budget!.expenses);
        console.log('we arehere => updatedDailyCategory ', updatedDailyCategory)
        return this.budgetService.updateExpenseAmount(userId!, budget!.id, updatedDailyCategory.expenseId, updatedDailyCategory.newAmount, updatedDailyCategory.newBalance)
          .pipe(
            map(( updatedExpense ) => BudgetActions.updateDailyCategorySuccess({ updatedExpense })),
            catchError(error => {
              return of(BudgetActions.updateDailyCategoryFailure({ error }))
            }),
          )
        }
      ),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  triggerUpdateBudgetAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.updateDailyCategorySuccess),
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

  updateBothExpenseBalances$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetActions.updateMultipleExpenseBalances),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudget).pipe(
          map(budget => budget ? budget.id : null)
        )
      ),
      switchMap(([action, userId, budgetId]) => {
        if (!userId || !budgetId) {
          return of(BudgetActions.updateMultipleExpenseBalancesFailure({ error: 'Missing userId or budgetId' }));
        }

        const updateOperations = action.updates.map(update =>
          this.budgetService.updateExpenseBalance(userId, budgetId, update.expenseId, update.newBalance)
            .pipe(
              map(() => update),
              catchError(error => {
                console.error(`Update failed for expenseId ${update.expenseId}`, error);
                return of({ error });
              })
            )
        );
        return forkJoin(updateOperations).pipe(
          map(results => {
            const hasError = results.some(result => 'error' in result && result.error != null);
            if (hasError) {
              return BudgetActions.updateMultipleExpenseBalancesFailure({ error: 'One or more updates failed' });
            } else {
              const successfulUpdates = results.filter(r => !('error' in r && r.error != null)) as Array<{ expenseId: string; newBalance: number }>;
        return BudgetActions.updateMultipleExpenseBalancesSuccess({ updates: successfulUpdates });
            }
          }),
          catchError(error => of(BudgetActions.updateMultipleExpenseBalancesFailure({ error }))),
          finalize(() => this.store.dispatch(SpinnerActions.endRequest())),
        );
      })
    )
  );

  deleteExpenseAction$ = createEffect(() => 
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

  addSpendAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.addSpend),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudgetId),
      ),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      switchMap(([{ date }, userId, budgetId ]) => {
        console.log('effects date', date)
        return this.budgetService.addSpend(userId!, budgetId!, date).pipe(
          map((spend: ISpend) => BudgetActions.addSpendSuccess({ spend })),
          catchError(error => {
            console.log('error => ', error)
            return of(BudgetActions.addSpendFailure({ error }))
          })
        )
      }
      ),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  deleteSpendAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.deleteSpend),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudgetId)
      ),
      switchMap(([ { spendId, expenseId, newAmount, newBalance }, userId, budgetId ]) => {
        return this.budgetService.deleteSpend(userId!, budgetId!, spendId ).pipe(
          map(() => BudgetActions.deleteSpendSuccess({ spendId, expenseId, newAmount, newBalance })),
          catchError(error => {
            console.log(error)
            return of(BudgetActions.deleteSpendFailure({ error }))
          })
        )
      }
      ),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  updateSpendTitleAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.updateSpendTitle),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudgetId)
      ),
      switchMap(([ { spendId, newTitle }, userId, budgetId ]) => {
        return this.budgetService.updateSpendTitle(userId!, budgetId!, spendId, newTitle).pipe(
          map(({ spendId, newTitle }) => BudgetActions.updateSpendTitleSuccess({ spendId, newTitle })),
          catchError(error => {
            return of(BudgetActions.updateSpendTitleFailure({ error }))
          })
        )
      }
      )
    )
  );

  updateSpendCategoryAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.updateSpendCategory),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudgetId)
      ),
      switchMap(([ { spendId, newCategory, amount }, userId, budgetId ]) => {
        return this.budgetService.updateSpendCategory(userId!, budgetId!, spendId, newCategory).pipe(
          map(({ spendId, newCategory }) => BudgetActions.updateSpendCategorySuccess({ spendId, newCategory, amount })),
          catchError(error => {
            return of(BudgetActions.updateSpendCategoryFailure({ error }))
          }),
        )
      }),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  // triggerUpdateExpenseBalance$ = createEffect(() => 
  //   this.actions$.pipe(
  //     ofType(BudgetActions.updateSpendCategorySuccess),
  //     tap(() => this.store.dispatch(SpinnerActions.startRequest())),
  //     withLatestFrom(
  //       this.store.select(UserSelectors.selectUserId),
  //       this.store.select(BudgetSelectors.selectCurrentBudget)
  //     ),
  //     switchMap(([ { spendId, newCategory, amount }, userId, budget ]) => {
  //       const expense = budget?.expenses.find((expense: IExpense) => expense.id === newCategory);

  //       return this.budgetService.updateExpenseAmount(userId!, budget!.id, newCategory, expense!.amount, expense!.balance - amount)
  //         .pipe(
  //           map(( updatedExpense ) => BudgetActions.updateExpenseAmountSuccess({ updatedExpense })),
  //           catchError(error => {
  //             return of(BudgetActions.updateExpenseAmountFailure({ error }))
  //           }),
  //         )
  //       }
  //     ),
  //     tap(() => this.store.dispatch(SpinnerActions.endRequest())),
  //   )
  // );

  

  updateSpendAmountAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.updateSpendAmount),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudgetId)
      ),
      switchMap(([ { spendId, amount, payloadForNextAction }, userId, budgetId ]) => {
        return this.budgetService.updateSpendAmount(userId!, budgetId!, spendId, amount).pipe(
          map(({ spendId, amount }) => BudgetActions.updateSpendAmountSuccess({ spendId, amount, payloadForNextAction })),
          catchError(error => {
            return of(BudgetActions.updateSpendAmountFailure({ error }))
          })
        )
      }
      )
    )
  );

  updateExpenseAmountAfterSpendSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetActions.updateSpendAmountSuccess),
      map(action => BudgetActions.updateExpenseAmount({
        expenseId: action.payloadForNextAction.categoryId,
        newAmount: action.payloadForNextAction.newAmount,
        newBalance: action.payloadForNextAction.newBalance,
      }))
    )
  );

}