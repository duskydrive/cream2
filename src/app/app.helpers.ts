import { IExpense } from "./shared/interfaces/budget.interface"

export const prepareExpenses = (arr: Pick<IExpense, 'title' | 'amount'>[]): Omit<IExpense, 'id'>[] => {
  return arr.map((expense: Pick<IExpense, 'title' | 'amount'>, index: number) => {
    return {
      ...expense,
      orderIndex: index,
      balance: expense.amount,
    };
  });
}

export const nullToZero = (value: number | null): number => {
  return value === null ? 0 : value;
}