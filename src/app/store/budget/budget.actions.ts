import { createAction, props } from "@ngrx/store";
import { IBudgetTitleAndId } from "src/app/core/models/interfaces";
import { IBudget, IBudgetPayload, IExpense, IExpensePayload } from "src/app/shared/models/budget.interface";

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
  props<{ userId: string, budgetData: IBudgetPayload, expenses: IExpensePayload[] }>()
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

export const updateExpenseAmount = createAction(
  '[Budget] Update Expense Amount',
  props<{ expenseId: string, newAmount: number, newBalance: number }>()
);

export const updateExpenseAmountSuccess = createAction(
  '[Budget] Update Expense Amount Success',
  props<{ expenseId: string, newAmount: number, newBalance: number }>()
);

export const updateExpenseAmountFailure = createAction(
  '[Budget] Update Expense Amount Failure',
  props<{ error: any }>()
);