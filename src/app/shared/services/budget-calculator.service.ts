import { Injectable } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import * as moment from 'moment';
import { IBudget, IExpense } from '../models/budget.interface';

@Injectable({
  providedIn: 'root'
})
export class BudgetCalculatorService {
  public countDaysDiff(dateStart: Timestamp, dateEnd: Timestamp): number {
    const startDate = moment(dateStart.toDate());
    const endDate = moment(dateEnd.toDate()).endOf('day');
    return endDate.diff(startDate, 'days') + 1; // Add 1 to include the end date in the count
  }
  
  public countCategorisedExpenses(arr: IExpense[]): number {
    return arr.reduce((acc: number, current: IExpense) => {
      return acc + current.amount;
    }, 0);
  }
  
  public countNewDaily (total: number, dateStart: Timestamp, dateEnd: Timestamp, expenses: IExpense[]): number {
    return Math.floor((total - this.countCategorisedExpenses(expenses)) / this.countDaysDiff(dateStart, dateEnd));
  }

  public isExpenseAmountValid(budget: IBudget, newAmount: number, oldAmount: number) {
    const plannedSpend = this.countCategorisedExpenses(budget.expenses);
    const daysDiff = this.countDaysDiff(budget.dateStart, budget.dateEnd);
    const newUncategorisedSpend = budget.total - plannedSpend + oldAmount - newAmount;
    const amountLeft = newUncategorisedSpend; // TODO later: add fact daily spends here (newUncatgorisedSpend - fact daily spends)
    const dailyWithUncategorisedSpend = amountLeft / daysDiff;
    if (dailyWithUncategorisedSpend > 1) {
      return true;
    }
    return false;
  }
}
