import { createFeatureSelector, createSelector } from "@ngrx/store";
import { IBudgetState } from "./budget.reducer";

export const selectBudgetState = createFeatureSelector<IBudgetState>('budget');

export const selectCurrentBudget = createSelector(
  selectBudgetState,
  (state: IBudgetState) => state.budget,
);

export const selectCurrentBudgetId = createSelector(
  selectBudgetState,
  (state: IBudgetState) => state.budget?.id,
);

export const copiedBudget = createSelector(
  selectBudgetState,
  (state: IBudgetState) => state.copiedBudget,
);

export const selectBudgetLoading = createSelector(
  selectBudgetState,
  (state: IBudgetState) => state.loading,
);

export const selectBudgetsTitlesAndIds = createSelector(
  selectBudgetState,
  (state: IBudgetState) => state.budgetTitlesAndIds,
);

export const selectCurrentSpend = createSelector(
  selectBudgetState,
  (state: IBudgetState) => state.spend,
);

export const selectTodayDaily = createSelector(
  selectBudgetState,
  (state: IBudgetState) => state.todayDaily,
);

export const selectExpenses = createSelector(
  selectBudgetState,
  (state: IBudgetState) => state.budget?.expenses,
);

export const selectDailyCategoryId = createSelector(
  selectBudgetState,
  (state: IBudgetState) => state.dailyCategoryId,
);