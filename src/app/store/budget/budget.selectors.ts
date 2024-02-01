import { createFeatureSelector, createSelector } from "@ngrx/store";
import { IBudgetState } from "./budget.reducer";

export const selectBudgetState = createFeatureSelector<IBudgetState>('budget');

export const selectCurrentBudget = createSelector(
  selectBudgetState,
  (state: IBudgetState) => state.budget,
);

export const selectBudgetLoading = createSelector(
  selectBudgetState,
  (state: IBudgetState) => state.loading,
);

export const selectBudgetsTitlesAndIds = createSelector(
  selectBudgetState,
  (state: IBudgetState) => state.budgetTitlesAndIds,
);