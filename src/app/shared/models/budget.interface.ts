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

export interface IExpense {
  id: string,
  title: string,
  amount: number,
  balance: number,
  orderIndex: number,
}
