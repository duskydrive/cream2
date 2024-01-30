import { createReducer, on } from "@ngrx/store";
import { IBudget } from "src/app/shared/models/budget.interface";
import * as BudgetActions from "./budget.actions";
import { IBudgetTitleAndId } from "src/app/core/models/interfaces";

export interface IBudgetState {
  budget: IBudget | null,
  budgetTitlesAndIds: IBudgetTitleAndId[] | null,
  loading: boolean,
  error: any,
}

export const initialState: IBudgetState = {
  budget: null,
  budgetTitlesAndIds: [],
  loading: false,
  error: null,
}

export const budgetReducer = createReducer(
  initialState,
  on(BudgetActions.loadBudget, state => ({
    ...state,
    loading: true,
  })),
  on(BudgetActions.loadBudgetSuccess, (state, { budget }) => ({
    ...state,
    loading: false,
    budget,
  })),
  on(BudgetActions.loadBudgetFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.createBudget, state => ({
    ...state,
    loading: true,
  })),
  on(BudgetActions.createBudgetSuccess, (state, { budget }) => ({
    ...state,
    loading: false,
    budget,
  })),
  on(BudgetActions.createBudgetFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.updateBudget, state => ({
    ...state,
    loading: true,
  })),
  on(BudgetActions.updateBudgetSuccess, (state, { budget }) => ({
    ...state,
    loading: false,
    budget,
  })),
  on(BudgetActions.updateBudgetFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.loadBudgetsTitlesAndIds, state => ({
    ...state,
    loading: true,
  })),
  on(BudgetActions.loadBudgetsTitlesAndIdsSuccess, (state, { budgetTitlesAndIds }) => ({
    ...state,
    loading: false,
    budgetTitlesAndIds,
  })),
  on(BudgetActions.loadBudgetsTitlesAndIdsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);