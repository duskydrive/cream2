import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, Observable, catchError, concatAll, finalize, forkJoin, from, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { BudgetService } from 'src/app/shared/services/budget.service';
import * as BudgetActions from './budget.actions';
import * as UserActions from '../user/user.actions';
import * as UserSelectors from '../user/user.selectors';
import * as BudgetSelectors from '../budget/budget.selectors';
import * as SpinnerActions from '../spinner/spinner.actions';
import { Action, Store } from '@ngrx/store';
import { IBudget, IExpense, ISpend } from 'src/app/shared/interfaces/budget.interface';
import { Router } from '@angular/router';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { FirebaseError } from '@angular/fire/app';
import { IBudgetTitleAndId } from 'src/app/core/interfaces/interfaces';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { BudgetCalculatorService } from 'src/app/shared/services/budget-calculator.service';
import { Timestamp } from '@angular/fire/firestore';
import { LocalStorageService } from 'src/app/core/services/storage.service';

@Injectable()
export class BudgetEffects {
  constructor(
    private actions$: Actions,
    private budgetService: BudgetService,
    private budgetCalculatorService: BudgetCalculatorService,
    private store: Store,
    private router: Router,
    private snackbarService: SnackbarService,
    private localStorageService: LocalStorageService,
  ) {}

  createBudget$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.createBudget),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      switchMap(({ userId, budgetData, expenses}) => 
        this.budgetService.createBudget(userId, budgetData, expenses).pipe(
          map((budget: IBudget) => {
            this.localStorageService.setItem('currentBudgetId', budget.id);
            this.localStorageService.removeItem('currentBudgetDate');

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
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudget,
      )),
      switchMap(([{ budgetData }, userId, currentBudget]) => {
        if (!currentBudget && 'isArchived' in budgetData && budgetData['isArchived'] === false) {
          return of(BudgetActions.loadBudgetsTitlesAndIds({ userId: userId! }));
        } else if (!currentBudget) {
          return EMPTY
        };

        const actionsToDispatch: Observable<Action>[] = [];
        const budgetId = currentBudget.id;

        if ('title' in budgetData) {
            const newTitle = budgetData.title!;
            actionsToDispatch.push(of(BudgetActions.updateBudgetTitleInList({ budgetId, newTitle })));
        }

        if ('total' in budgetData) {
            actionsToDispatch.push(of(BudgetActions.updateDailyCategoryAmount()));
        }

        if ('isArchived' in budgetData && budgetData['isArchived'] === true) {
          this.localStorageService.removeItem('currentBudgetId');
          actionsToDispatch.push(of(BudgetActions.resetBudget()));
        }

        if ('isArchived' in budgetData && budgetData['isArchived'] === false) {
          actionsToDispatch.push(of(BudgetActions.loadBudgetsTitlesAndIds({ userId: userId! })));
        }

        return from(actionsToDispatch).pipe(concatAll());
      }),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  triggerLoadBudgetsTitlesAndIds$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.setUser, BudgetActions.createBudgetSuccess, BudgetActions.resetBudget),
      withLatestFrom(this.store.select(UserSelectors.selectUserId)),
      switchMap(([, userId]) => {
        if (!userId) {
          return of(BudgetActions.loadBudgetsTitlesAndIdsFailure({ error: 'no_user_id' }));
        }
        
        return of(BudgetActions.loadBudgetsTitlesAndIds({ userId }));
      }),
      catchError((error) => of(BudgetActions.loadBudgetsTitlesAndIdsFailure({ error })))
    )
  );

  triggerLoadBudgetFromLocalStorage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.setUser),
      switchMap(( { user } ) => {
        if (user.userId && this.localStorageService.hasKey('currentBudgetId')) {
          return of(BudgetActions.loadBudget({ userId: user.userId, budgetId: this.localStorageService.getItem('currentBudgetId')! }))
        }
        return EMPTY;
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
          return of(BudgetActions.loadBudgetsTitlesAndIdsFailure( { error: 'no_user_found' }));
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
            const storedBudgetId = this.localStorageService.getItem('currentBudgetId');
            if (storedBudgetId && storedBudgetId !== budgetId) {
              this.localStorageService.removeItem('currentBudgetDate');
            }
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

  getDailyCategoryId$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.loadBudgetSuccess),
      switchMap(({ budget }) => {
        this.localStorageService.setItem('currentBudgetId', budget.id);

        const dailyExpense = budget.expenses.find((expense: IExpense) => expense.title === 'Daily');

        if (dailyExpense === undefined) {
          return of(BudgetActions.getDailyCategoryIdFailure( { error: 'no_daily' }));
        }

        return of(BudgetActions.getDailyCategoryIdSuccess( { dailyCategoryId: dailyExpense.id }));
      }),
    )
  );

  loadSpendByDate$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.loadSpendByDate),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudgetId),
      ),
      switchMap(([{date}, userId, budgetId]) => {
        return this.budgetService.getSpendByDate(userId!, budgetId!, date).pipe(
          map((spend: ISpend[]) => {  
            this.localStorageService.setItem('currentBudgetDate', date.toISOString());
            return BudgetActions.loadSpendByDateSuccess( { spend });
          }),
          catchError((error: FirebaseError) => {
            this.snackbarService.showError(error.code || 'some_error');
            return of(BudgetActions.loadSpendByDateFailure( { error }));
          }),
        )
      }),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  loadPreviousSpend$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.loadPreviousSpend),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudgetId),
        this.store.select(BudgetSelectors.selectDailyCategoryId),
      ),
      switchMap(([date, userId, budgetId, dailyCategoryId]) => {
        return this.budgetService.getPreviousSpend(userId!, budgetId!, date.date, dailyCategoryId!).pipe(
          map((previousUncategorisedSpend: number) => {  
            this.store.dispatch(BudgetActions.countTodayDaily({ date: date.date, previousUncategorisedSpend }));
            return BudgetActions.loadPreviousSpendSuccess();
          }),
          catchError((error: FirebaseError) => {
            this.snackbarService.showError(error.code || 'some_error');
            return of(BudgetActions.loadPreviousSpendFailure( { error }));
          }),
        )
      }),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  countTodayDaily$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.countTodayDaily),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudget),
      ),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      switchMap(([{date, previousUncategorisedSpend}, userId, budget]) => {
        if (!budget) {
          return of(BudgetActions.countTodayDailyFailure( { error: 'some_error' }));
        } else {
          const uncategorisedSpendTotalAmount = this.budgetCalculatorService.getUncategorisedSpend(budget!.expenses).amount;
          const totalDays = this.budgetCalculatorService.countDaysDiff(budget!.dateStart, budget!.dateEnd);
          const daysLeft = this.budgetCalculatorService.countDaysDiff(Timestamp.fromDate(new Date(date.setHours(0, 0, 0, 0))), budget!.dateEnd);
          let daysDiff = totalDays - (totalDays - daysLeft);
          const todayDaily = Math.floor((uncategorisedSpendTotalAmount - previousUncategorisedSpend) / daysDiff);

          return of(BudgetActions.countTodayDailySuccess({ todayDaily }));
        }
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
          return BudgetActions.reorderItemsActionFailure({ error: 'some_error' });
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
          return of(BudgetActions.updateMultipleExpenseBalancesFailure({ error: 'some_error' }));
        }

        const updateOperations = action.updates.map(update =>
          this.budgetService.updateExpenseBalance(userId, budgetId, update.expenseId, update.newBalance)
            .pipe(
              map(() => update),
              catchError(error => {
                return of({ error });
              })
            )
        );
        return forkJoin(updateOperations).pipe(
          map(results => {
            const hasError = results.some(result => 'error' in result && result.error != null);
            if (hasError) {
              return BudgetActions.updateMultipleExpenseBalancesFailure({ error: 'some_error' });
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
        this.store.select(BudgetSelectors.selectDailyCategoryId),
      ),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      switchMap(([{ date }, userId, budgetId, dailyCategoryId ]) => {
        return this.budgetService.addSpend(userId!, budgetId!, date, dailyCategoryId!).pipe(
          map((spend: ISpend) => BudgetActions.addSpendSuccess({ spend })),
          catchError(error => {
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
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
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
      }),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
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

  updateSpendAmountAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.updateSpendAmount),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
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
      }),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
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

  addFixAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.addFix),
      withLatestFrom(
        this.store.select(UserSelectors.selectUserId),
        this.store.select(BudgetSelectors.selectCurrentBudget),
        this.store.select(BudgetSelectors.selectDailyCategoryId),
      ),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      switchMap(([{ amount }, userId, budget, dailyCategoryId ]) => {
        return this.budgetService.addFix(userId!, budget!.id, budget!.dateStart, dailyCategoryId!).pipe(
          map((spend: ISpend) => BudgetActions.addFixSuccess({spendId: spend.id, amount})),
          catchError(error => {
            return of(BudgetActions.addSpendFailure({ error }))
          })
        )
      }),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  addFixSuccessAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(BudgetActions.addFixSuccess),
      withLatestFrom(
        this.store.select(BudgetSelectors.selectCurrentBudget),
        this.store.select(BudgetSelectors.selectDailyCategoryId),
      ),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      switchMap(([{ spendId, amount }, budget, dailyCategoryId ]) => {
        const dailyBudgetCategory = budget?.expenses.find((expense: IExpense) => expense.id === dailyCategoryId);

        if (dailyBudgetCategory!.balance - (-amount) <= 0) {
          return of(BudgetActions.updateSpendAmountFailure({ error: 'fix_error' }));
        }
        
        return of(BudgetActions.updateSpendAmount( { spendId, amount: (-amount), payloadForNextAction: { categoryId: dailyCategoryId, newAmount: dailyBudgetCategory!.amount, newBalance: dailyBudgetCategory!.balance - (-amount) } }));
      }),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );
}