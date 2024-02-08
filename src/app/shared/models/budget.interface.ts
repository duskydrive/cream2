import { Timestamp } from "firebase/firestore";

export interface IBudget {
  id: string,
  title: string,
  dateStart: Timestamp,
  dateEnd: Timestamp,
  total: number,
  daily: number,
  currency: string,
  expenses: IExpense[],
}

export interface IBudgetPayload {
  title: string,
  dateStart: Timestamp,
  dateEnd: Timestamp,
  total: number,
  currency: string,
  daily: number,
}

export interface IExpense {
  id?: string,
  title: string,
  amount: number,
  balance: number,
  orderIndex: number,
}

export interface IExpenseExtended {
  id?: string,
  title: string,
  originalTitle: string,
  amount: number,
  balance: number,
  orderIndex: number,
}

export interface IExpensePayload {
  title: string,
  amount: number,
  balance: number,
  orderIndex: number,
}

export interface IExpenseTitleAndAmount {
  title: string,
  amount: number,
}