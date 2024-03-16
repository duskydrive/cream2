import { createReducer, on } from "@ngrx/store";
import { IBudget, ISpend } from "src/app/shared/models/budget.interface";
import * as BudgetActions from "./budget.actions";
import { IBudgetTitleAndId } from "src/app/core/interfaces/interfaces";

export interface IBudgetState {
  budget: IBudget | null,
  spend: ISpend[],
  todayDaily: number | null,
  budgetTitlesAndIds: IBudgetTitleAndId[] | null,
  dailyCategoryId: string | null,
  copiedBudget: IBudget | null;
  loading: boolean,
  error: any,
}

export const initialState: IBudgetState = {
  budget: null,
  spend: [],
  todayDaily: null,
  budgetTitlesAndIds: [],
  dailyCategoryId: null,
  copiedBudget: null,
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
  on(BudgetActions.updateBudgetSuccess, (state, { budgetData }) => {
    if (budgetData.hasOwnProperty('isArchived')) {
      return {
        ...state,
        loading: false,
      };
    } else {
      return {
        ...state,
        loading: false,
        budget: {
          ...state.budget,
          ...(budgetData as IBudget),
        },
      }
    }
  }),
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
  on(BudgetActions.updateExpenseAmountSuccess, (state, { updatedExpense }) => {
    if (!state.budget || !state.budget.expenses) return { ...state, loading: false };
  
    const index = state.budget.expenses.findIndex((e) => e.id === updatedExpense.expenseId);

    if (index !== -1) {
      // Create a deep copy of the expenses array and update the title
      const updatedExpenses = state.budget.expenses.map((expense, idx) => 
      idx === index ? { ...expense, amount: updatedExpense.newAmount, balance: updatedExpense.newBalance } : expense);
        
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
  // on(BudgetActions.updateExpenseBalance, state => ({
  //   ...state,
  //   loading: true,
  // })), 
  on(BudgetActions.updateExpenseBalanceSuccess, (state, { expenseId, newBalance }) => {
    if (!state.budget || !state.budget.expenses) return { ...state, loading: false };
  
    const index = state.budget.expenses.findIndex((e) => e.id === expenseId);

    if (index !== -1) {
      // Create a deep copy of the expenses array and update the title
      const updatedExpenses = state.budget.expenses.map((expense, idx) => 
      idx === index ? { ...expense, balance: newBalance } : expense);
        
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
  on(BudgetActions.updateExpenseBalanceFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
   on(BudgetActions.updateMultipleExpenseBalances, state => ({
    ...state,
    loading: true,
  })), 
  on(BudgetActions.updateMultipleExpenseBalancesSuccess, (state, { updates }) => {
    if (!state.budget || !state.budget.expenses) {
      return { ...state, loading: false };
    }
  
    // Map over the existing expenses to update their balances based on the action's updates array
    const updatedExpenses = state.budget.expenses.map(expense => {
      const update = updates.find(u => u.expenseId === expense.id);
      return update ? { ...expense, balance: update.newBalance } : expense;
    });
  
    // Update the budget part of the state with the new expenses array
    return {
      ...state,
      budget: {
        ...state.budget,
        expenses: updatedExpenses,
      },
      loading: false,
    };
  }),
   on(BudgetActions.updateMultipleExpenseBalancesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.updateDailyCategorySuccess, (state, { updatedExpense }) => {
    if (!state.budget || !state.budget.expenses) return { ...state, loading: false };
  
    const index = state.budget.expenses.findIndex((e) => e.id === updatedExpense.expenseId);

    if (index !== -1) {
      // Create a deep copy of the expenses array and update the title
      const updatedExpenses = state.budget.expenses.map((expense, idx) => 
      idx === index ? { ...expense, amount: updatedExpense.newAmount, balance: updatedExpense.newBalance } : expense);
        
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
  on(BudgetActions.updateDailyCategoryFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.deleteExpense, state => ({
    ...state,
    loading: true,
  })),
  on(BudgetActions.deleteExpenseSuccess, (state, { expenseId }) => {
    if (!state.budget || !state.budget.expenses) return { ...state, loading: false };
  
    const updatedExpenses = state.budget.expenses.filter((expense) => expense.id !== expenseId);
    
    return {
      ...state,
      budget: {
        ...state.budget,
        expenses: updatedExpenses,
      },
      loading: false,
    };
  }),  
  on(BudgetActions.deleteExpenseFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.addExpenseSuccess, (state, { expense }) => {
    if (!state.budget || !state.budget.expenses) return { ...state, loading: false };
  
    const updatedExpenses = [...state.budget.expenses, expense];
    
    return {
      ...state,
      budget: {
        ...state.budget,
        expenses: updatedExpenses,
      },
      loading: false,
    };
  }),  
  on(BudgetActions.addExpenseFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.updateBudgetTitleInList, (state, { budgetId, newTitle }) => {
    if (!state.budgetTitlesAndIds) {
      return { ...state };
    }
  
    const budgetTitlesAndIdsCopy = [...state.budgetTitlesAndIds];
    const budgetToUpdateIndex = budgetTitlesAndIdsCopy.findIndex(budget => budget.id === budgetId);
  
    if (budgetToUpdateIndex !== -1) {
      const updatedBudgets = budgetTitlesAndIdsCopy.map((item, index) =>
        index === budgetToUpdateIndex ? { ...item, title: newTitle } : item
      );
  
      return {
        ...state,
        budgetTitlesAndIds: updatedBudgets
      };
    } else {
      return { ...state };
    }
  }),
  on(BudgetActions.copyBudget, (state, { budget }) => ({
    ...state,
    copiedBudget: {
      ...budget,
    },
  })),
  on(BudgetActions.resetCopiedBudget, (state) => ({
    ...state,
    copiedBudget: null,
  })),
  on(BudgetActions.loadSpendByDate, state => ({
    ...state,
    loading: true,
  })),
  on(BudgetActions.loadSpendByDateSuccess, (state, { spend }) => ({
    ...state,
    loading: false,
    spend,
  })),
  on(BudgetActions.loadSpendByDateFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.loadPreviousSpend, state => ({
    ...state,
    loading: true,
  })),
  on(BudgetActions.loadPreviousSpendSuccess, (state) => ({
    ...state,
    loading: false,
  })),
  on(BudgetActions.loadPreviousSpendFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.countTodayDaily, state => ({
    ...state,
    loading: true,
  })),
  on(BudgetActions.countTodayDailySuccess, (state, { todayDaily }) => ({
    ...state,
    loading: false,
    todayDaily,
  })),
  on(BudgetActions.countTodayDailyFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.deleteSpend, state => ({
    ...state,
    loading: true,
  })),
  on(BudgetActions.deleteSpendSuccess, (state, { spendId }) => {
    if (!state.budget || !state.spend) return { ...state, loading: false };
  
    const updatedSpend = state.spend.filter((spend: ISpend) => spend.id !== spendId);
    
    return {
      ...state,
      spend: updatedSpend,
      loading: false,
    };
  }),
  on(BudgetActions.deleteSpendFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.addSpendSuccess, (state, { spend }) => {
    if (!state.spend) return { ...state, loading: false };
  
    const updatedSpend = [...state.spend, spend];
    
    return {
      ...state,
      spend: updatedSpend,
      loading: false,
    };
  }),  
  on(BudgetActions.addSpendFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.updateSpendTitle, state => ({
    ...state,
    loading: true,
  })),
  on(BudgetActions.updateSpendTitleSuccess, (state, { spendId, newTitle }) => {
    if (!state.spend) return { ...state, loading: false };
  
    const index = state.spend.findIndex((e) => e.id === spendId);
    
    if (index !== -1) {
      const updatedSpend = state.spend.map((singleSpend, idx) => 
        idx === index ? { ...singleSpend, title: newTitle } : singleSpend);

      return {
        ...state,
        spend: updatedSpend,
        loading: false,
      };
    } else {
      return { ...state, loading: false };
    }
  }),  
  on(BudgetActions.updateSpendTitleFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.updateSpendCategory, state => ({
    ...state,
    loading: true,
  })),
  on(BudgetActions.updateSpendCategorySuccess, (state, { spendId, newCategory }) => {
    if (!state.spend) return { ...state, loading: false };
  
    const index = state.spend.findIndex((e) => e.id === spendId);
    
    if (index !== -1) {
      const updatedSpend = state.spend.map((singleSpend, idx) => 
        idx === index ? { ...singleSpend, categoryId: newCategory } : singleSpend);

      return {
        ...state,
        spend: updatedSpend,
        loading: false,
      };
    } else {
      return { ...state, loading: false };
    }
  }),  
  on(BudgetActions.updateSpendCategoryFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.updateSpendAmount, state => ({
    ...state,
    loading: true,
  })),
  on(BudgetActions.updateSpendAmountSuccess, (state, { spendId, amount }) => {
    if (!state.spend) return { ...state, loading: false };
  
    const index = state.spend.findIndex((e) => e.id === spendId);
    
    if (index !== -1) {
      const updatedSpend = state.spend.map((singleSpend, idx) => 
        idx === index ? { ...singleSpend, amount } : singleSpend);

      return {
        ...state,
        spend: updatedSpend,
        loading: false,
      };
    } else {
      return { ...state, loading: false };
    }
  }),  
  on(BudgetActions.updateSpendAmountFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.getDailyCategoryIdSuccess, (state, { dailyCategoryId }) => ({
    ...state,
    dailyCategoryId,
  })),  
  on(BudgetActions.getDailyCategoryIdFailure, (state, { error }) => ({
    ...state,
    error,
  })),
  on(BudgetActions.addFix, (state) => ({
    ...state,
    loading: true,
  })),
  on(BudgetActions.addFixSuccess, (state) => ({
    ...state,
    loading: false,
  })),  
  on(BudgetActions.addSpendFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BudgetActions.resetBudget, (state) => ({
    ...state,
    budget: null,
    spend: [],
    todayDaily: null,
    dailyCategoryId: null,
    copiedBudget: null,
    loading: false,
    error: null,
  })),
);

