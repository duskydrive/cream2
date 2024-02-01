import { IExpensePayload, IExpenseTitleAndAmount } from "./shared/models/budget.interface"

export const prepareExpenses = (arr: IExpenseTitleAndAmount[]): IExpensePayload[] => {
  return arr.map((expense: IExpenseTitleAndAmount, index: number) => {
    return {
      ...expense,
      orderIndex: index,
      balance: expense.amount,
    };
  });
}
