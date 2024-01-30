import { Timestamp } from "firebase/firestore";

export interface IBudget {
  title: string,
  dateStart: Timestamp,
  dateEnd: Timestamp,
  total: number,
  currency: string,
  expenses: IExpense[],
}

export interface IBudgetPayload {
  title: string,
  dateStart: Timestamp,
  dateEnd: Timestamp,
  total: number,
  currency: string,
}

export interface IExpense {
  title: string,
  amount: number,
  orderIndex: number,
}

export interface IUnorderedExpense {
  title: string,
  amount: number,
}