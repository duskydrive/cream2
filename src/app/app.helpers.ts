import * as moment from 'moment';
import { Timestamp } from '@angular/fire/firestore';
import { IExpense, IExpensePayload, IExpenseTitleAndAmount } from "./shared/models/budget.interface"

export const prepareExpenses = (arr: IExpenseTitleAndAmount[]): IExpensePayload[] => {
  return arr.map((expense: IExpenseTitleAndAmount, index: number) => {
    return {
      ...expense,
      orderIndex: index,
      balance: expense.amount,
    };
  });
}

export const countDaysDiff = (dateStart: Timestamp, dateEnd: Timestamp): number => {
  const startDate = moment(dateStart.toDate());
  const endDate = moment(dateEnd.toDate()).endOf('day');
  return endDate.diff(startDate, 'days') + 1; // Add 1 to include the end date in the count
}

export const countCategorisedExpenses = (arr: IExpense[]): number => {
  return arr.reduce((acc: number, current: IExpense) => {
    return acc + current.amount;
  }, 0);
}