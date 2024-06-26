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
  isArchived: boolean,
}

export interface IExpense {
  id: string,
  title: string,
  amount: number,
  balance: number,
  orderIndex: number,
}

export interface ISpend {
  id: string,
  title: string,
  amount: number,
  categoryId: string | null,
  date: Timestamp,
  created_at: Timestamp,
}
