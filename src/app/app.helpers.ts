import { IExpense, IUnorderedExpense } from "./shared/models/budget.interface"

export const toIndexArray = (arr: IUnorderedExpense[]): IExpense[] => {
  return arr.map((expense: IUnorderedExpense, index: number) => {
    return {
      ...expense,
      orderIndex: index,
    };
  });
}
