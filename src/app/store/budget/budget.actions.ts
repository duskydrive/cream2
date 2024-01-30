import { createAction, props } from "@ngrx/store";
import { IBudgetTitleAndId } from "src/app/core/models/interfaces";
import { IBudget, IBudgetPayload, IExpense } from "src/app/shared/models/budget.interface";

export const loadBudget = createAction(
  '[Budget] Load Budget',
  props<{ budgetId: string }>()
);

export const loadBudgetSuccess = createAction(
  '[Budget] Load Budget Success',
  props<{ budget: IBudget }>()
);

export const loadBudgetFailure = createAction(
  '[Budget] Load Budget Failure',
  props<{ error: any }>()
);

export const createBudget = createAction(
  '[Budget] Create Budget',
  props<{ userId: string, budgetData: IBudgetPayload, expenses: IExpense[] }>()
);

export const createBudgetSuccess = createAction(
  '[Budget] Create Budget Success',
  props<{ budget: IBudget }>()
);

export const createBudgetFailure = createAction(
  '[Budget] Create Budget Failure',
  props<{ error: any }>()
);

export const updateBudget = createAction(
  '[Budget] Update Budget',
  props<{ budget: IBudget }>()
);

export const updateBudgetSuccess = createAction(
  '[Budget] Update Budget Success',
  props<{ budget: IBudget }>()
);

export const updateBudgetFailure = createAction(
  '[Budget] Update Budget Failure',
  props<{ error: any }>()
);

export const loadBudgetsTitlesAndIds = createAction(
  '[Budget] Load Budgets Titles And Ids',
  props<{ userId: string }>()
);

export const loadBudgetsTitlesAndIdsSuccess = createAction(
  '[Budget] Load Budgets Titles And Ids Success',
  props<{ budgetTitlesAndIds: IBudgetTitleAndId[] }>()
);

export const loadBudgetsTitlesAndIdsFailure = createAction(
  '[Budget] Load Budgets Titles And Ids Failure',
  props<{ error: any }>()
);