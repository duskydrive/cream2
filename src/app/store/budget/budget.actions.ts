import { createAction, props } from "@ngrx/store";
import { IBudgetTitleAndId } from "src/app/core/models/interfaces";
import { IBudget, IExpense, ISpend } from "src/app/shared/models/budget.interface";

export const loadBudget = createAction(
  '[Budget] Load Budget',
  props<{ userId: string, budgetId: string }>()
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
  props<{ userId: string, budgetData: Omit<IBudget, 'id' | 'expenses'>, expenses: Omit<IExpense, 'id'>[] }>()
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
  props<{ budgetId: string, budgetData: Partial<IBudget> }>()
);

export const updateBudgetSuccess = createAction(
  '[Budget] Update Budget Success',
  props<{ budgetData: Partial<IBudget> }>()
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

export const reorderItemsAction = createAction(
  '[Budget] Reorder Items Action',
  props<{ previousIndex: number, currentIndex: number, items: IExpense[] }>()
);

export const reorderItemsActionSuccess = createAction(
  '[Budget] Reorder Items Action Success',
  props<{ expenses: IExpense[] }>()
);

export const reorderItemsActionFailure = createAction(
  '[Budget] Reorder Items Action Failure',
  props<{ error: any }>()
);

export const changeExpensesOrder = createAction(
  '[Budget] Change Expenses Order',
  props<{ userId: string, budgetId: string, expenses: IExpense[] }>()
);

export const changeExpensesOrderSuccess = createAction(
  '[Budget] Change Expenses Order Success',
);

export const changeExpensesOrderFailure = createAction(
  '[Budget] Change Expenses Order Failure',
  props<{ error: any }>()
);

export const updateExpenseTitle = createAction(
  '[Budget] Update Expense Title',
  props<{ expenseId: string, newTitle: string }>()
);

export const updateExpenseTitleSuccess = createAction(
  '[Budget] Update Expense Title Success',
  props<{ expenseId: string, newTitle: string }>()
);

export const updateExpenseTitleFailure = createAction(
  '[Budget] Update Expense Title Failure',
  props<{ error: any }>()
);
export interface IExpenseUpdatePayload {
  expenseId: string, 
  newAmount: number, 
  newBalance: number,
}
export const updateExpenseAmount = createAction(
  '[Budget] Update Expense Amount',
  props<{ expenseId: string, newAmount: number, newBalance: number }>()
);

export const updateExpenseAmountSuccess = createAction(
  '[Budget] Update Expense Amount Success',
  props<{ updatedExpense: IExpenseUpdatePayload }>()
);

export const updateExpenseAmountFailure = createAction(
  '[Budget] Update Expense Amount Failure',
  props<{ error: any }>()
);

// export const updateExpenseBalance = createAction(
//   '[Budget] Update Expense Balance',
//   props<{ expenseId: string, newBalance: number }>()
// );

export const updateExpenseBalanceSuccess = createAction(
  '[Budget] Update Expense Balance Success',
  props<{ expenseId: string, newBalance: number }>()
);

export const updateExpenseBalanceFailure = createAction(
  '[Budget] Update Expense Balance Failure',
  props<{ error: any }>()
);

export const updateMultipleExpenseBalances = createAction(
  '[Budget] Update Multiple Expense Balances',
  props<{ updates: Array<{ expenseId: string; newBalance: number }> }>()
);

export const updateMultipleExpenseBalancesSuccess = createAction(
  '[Budget] Update Multiple Expense Balances Success',
  props<{ updates: Array<{ expenseId: string; newBalance: number }> }>()
);

export const updateMultipleExpenseBalancesFailure = createAction(
  '[Budget] Update Multiple Expense Balances Failure',
  props<{ error: any }>()
);

export const updateDailyCategoryAmount = createAction(
  '[Budget] Update Daily Category Amount',
);

export const updateDailyCategorySuccess = createAction(
  '[Budget] Update Daily Category Amount Success',
  props<{ updatedExpense: IExpenseUpdatePayload }>()
);

export const updateDailyCategoryFailure = createAction(
  '[Budget] Update Daily Category Amount Failure',
  props<{ error: any }>()
);

export const deleteExpense = createAction(
  '[Budget] Delete Expense',
  props<{ expenseId: string }>()
);

export const deleteExpenseSuccess = createAction(
  '[Budget] Delete Expense Success',
  props<{ expenseId: string }>()
);

export const deleteExpenseFailure = createAction(
  '[Budget] Delete Expense Failure',
  props<{ error: any }>()
);

export const addExpense = createAction(
  '[Budget] Add Expense',
);

export const addExpenseSuccess = createAction(
  '[Budget] Add Expense Success',
  props<{ expense: IExpense }>()
);

export const addExpenseFailure = createAction(
  '[Budget] Add Expense Failure',
  props<{ error: any }>()
);

export const updateBudgetTitleInList = createAction(
  '[Budget] Update Budget Title In List',
  props<{ budgetId: string, newTitle: string }>()
);

export const copyBudget = createAction(
  '[Budget] Copy Budget',
  props<{ budget: IBudget }>()
);

export const resetCopiedBudget = createAction(
  '[Budget] Reset Copied Budget',
);

export const loadSpendByDate = createAction(
  '[Budget] Load Spend By Date',
  props<{ date: Date }>()
);

export const loadSpendByDateSuccess = createAction(
  '[Budget] Load Spend By Date Success',
  props<{ spend: ISpend[] }>()
);

export const loadSpendByDateFailure = createAction(
  '[Budget] Load Spend By Date Failure',
  props<{ error: any }>()
);

export const loadPreviousSpend = createAction(
  '[Budget] Load Previous Spend',
  props<{ date: Date }>()
);

export const loadPreviousSpendSuccess = createAction(
  '[Budget] Load Previous Spend Success',
);

export const loadPreviousSpendFailure = createAction(
  '[Budget] Load Previous Spend Failure',
  props<{ error: any }>()
);

export const countTodayDaily = createAction(
  '[Budget] Count Today Daily',
  props<{ date: Date, previousUncategorisedSpend: number }>()
);

export const countTodayDailySuccess = createAction(
  '[Budget] Count Today Daily Success',
  props<{ todayDaily: number }>()
);

export const countTodayDailyFailure = createAction(
  '[Budget] Count Today Daily Failure',
  props<{ error: any }>()
);

export const deleteSpend = createAction(
  '[Budget] Delete Spend',
  props<{ spendId: string, expenseId: string, newAmount: number, newBalance: number }>()
);

export const deleteSpendSuccess = createAction(
  '[Budget] Delete Spend Success',
  props<{ spendId: string, expenseId: string, newAmount: number, newBalance: number }>()
);

export const deleteSpendFailure = createAction(
  '[Budget] Delete Spend Failure',
  props<{ error: any }>()
);

export const addSpend = createAction(
  '[Budget] Add Spend',
  props<{ date: Date }>()
);

export const addSpendSuccess = createAction(
  '[Budget] Add Spend Success',
  props<{ spend: ISpend }>()
);

export const addSpendFailure = createAction(
  '[Budget] Add Spend Failure',
  props<{ error: any }>()
);

export const updateSpendTitle = createAction(
  '[Budget] Update Spend Title',
  props<{ spendId: string, newTitle: string }>()
);

export const updateSpendTitleSuccess = createAction(
  '[Budget] Update Spend Title Success',
  props<{ spendId: string, newTitle: string }>()
);

export const updateSpendTitleFailure = createAction(
  '[Budget] Update Spend Title Failure',
  props<{ error: any }>()
);

export const updateSpendCategory = createAction(
  '[Budget] Update Spend Category',
  props<{ spendId: string, newCategory: string, amount: number }>()
);

export const updateSpendCategorySuccess = createAction(
  '[Budget] Update Spend Category Success',
  props<{ spendId: string, newCategory: string, amount: number }>()
);

export const updateSpendCategoryFailure = createAction(
  '[Budget] Update Spend Category Failure',
  props<{ error: any }>()
);

export const updateSpendAmount = createAction(
  '[Budget] Update Spend Amount',
  props<{ spendId: string, amount: number, payloadForNextAction: any }>()
);

export const updateSpendAmountSuccess = createAction(
  '[Budget] Update Spend Amount Success',
  props<{ spendId: string, amount: number, payloadForNextAction: any }>()
);

export const updateSpendAmountFailure = createAction(
  '[Budget] Update Spend Amount Failure',
  props<{ error: any }>()
);

export const getDailyCategoryIdSuccess = createAction(
  '[Budget] Get Daily Category Id Success',
  props<{ dailyCategoryId: string }>()
);

export const getDailyCategoryIdFailure = createAction(
  '[Budget] Get Daily Category Id Failure',
  props<{ error: any }>()
);
