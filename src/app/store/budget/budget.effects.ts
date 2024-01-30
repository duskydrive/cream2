import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { BudgetService } from 'src/app/shared/services/budget.service';
import * as BudgetActions from './budget.actions';
import * as UserActions from '../user/user.actions';
import * as SpinnerActions from '../spinner/spinner.actions';
import { Store } from '@ngrx/store';
import { IBudget } from 'src/app/shared/models/budget.interface';
import { Router } from '@angular/router';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { FirebaseError } from '@angular/fire/app';
import { IBudgetTitleAndId } from 'src/app/core/models/interfaces';

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
            this.snackbarService.showSuccess('budget_create_success');
            this.router.navigate(['/budget']);
            return BudgetActions.loadBudgetSuccess( { budget });
          }),
          catchError((error: FirebaseError) => {
            this.snackbarService.showError(error.code || 'budget_load_error');
            return of(BudgetActions.loadBudgetFailure( { error }));
          }),
        )
      ),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  loadBudgetsTitlesAndIds$ = createEffect(() => 
    this.actions$.pipe(
      ofType(UserActions.setUser),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      switchMap(({ user }) => {
        if (user) {
          return this.budgetService.getBudgetsTitlesAndIds(user.userId!).pipe(
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
}