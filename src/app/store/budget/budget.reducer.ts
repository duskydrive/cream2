import { createReducer, on } from "@ngrx/store";
import { IBudget, IExpense } from "src/app/shared/models/budget.interface";
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
  on(BudgetActions.updateBudgetSuccess, (state, { budgetData }) => ({
    ...state,
    loading: false,
    budget: {
      ...state.budget,
      ...(budgetData as IBudget),
    },
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
  on(BudgetActions.changeExpensesOrder, state => ({
    ...state,
  })),
  on(BudgetActions.changeExpensesOrderSuccess, state => ({
    ...state,
  })),
  on(BudgetActions.changeExpensesOrderFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.reorderItemsAction, state => ({
    ...state,
  })),
  on(BudgetActions.reorderItemsActionSuccess, (state, { expenses }) => ({
    ...state,
    budget: {
      ...state.budget!,
      expenses,
    }
  })),
  on(BudgetActions.reorderItemsActionFailure, (state, { error }) => ({
    ...state,
    error,
  })),
  on(BudgetActions.updateExpenseTitle, state => ({
    ...state,
    loading: true,
  })),
  on(BudgetActions.updateExpenseTitleSuccess, (state, { expenseId, newTitle }) => {
    // Guard clause if budget or expenses are null
    if (!state.budget || !state.budget.expenses) return { ...state, loading: false };
  
    const index = state.budget.expenses.findIndex((e) => e.id === expenseId);
    
    if (index !== -1) {
      // Create a deep copy of the expenses array and update the title
      const updatedExpenses = state.budget.expenses.map((expense, idx) => 
        idx === index ? { ...expense, title: newTitle } : expense);
  
      // Update the budget part of the state with new expenses array
      return {
        ...state,
        budget: {
          ...state.budget,
          expenses: updatedExpenses,
        },
        loading: false,
      };
    } else {
      // Return state unchanged if the expense is not found
      return { ...state, loading: false };
    }
  }),  
  on(BudgetActions.updateExpenseTitleFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.updateExpenseAmount, state => ({
    ...state,
    loading: true,
  })),
  on(BudgetActions.updateExpenseAmountSuccess, (state, { expenseId, newAmount, newBalance }) => {
    if (!state.budget || !state.budget.expenses) return { ...state, loading: false };
  
    const index = state.budget.expenses.findIndex((e) => e.id === expenseId);
    
    if (index !== -1) {
      // Create a deep copy of the expenses array and update the title
      const updatedExpenses = state.budget.expenses.map((expense, idx) => 
        idx === index ? { ...expense, amount: newAmount, balance: newBalance } : expense);

        console.log(updatedExpenses)
  
      // Update the budget part of the state with new expenses array
      return {
        ...state,
        budget: {
          ...state.budget,
          expenses: updatedExpenses,
        },
        loading: false,
      };
    } else {
      // Return state unchanged if the expense is not found
      return { ...state, loading: false };
    }
  }),  
  on(BudgetActions.updateExpenseAmountFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);