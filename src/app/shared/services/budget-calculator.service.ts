import { Injectable } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import * as moment from 'moment';
import { IBudget, IExpense } from '../interfaces/budget.interface';

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
      if (current.title === 'Daily') {
        return acc;
      }
      return acc + current.amount;
    }, 0);
  }

  public getUncategorisedSpend(arr: IExpense[]): IExpense {
    const uncategorisedSpend: IExpense = arr.find((expense: IExpense) => expense.title === 'Daily')!;
    return uncategorisedSpend;
  }
  
  public countNewDaily (total: number, dateStart: Timestamp, dateEnd: Timestamp, expenses: IExpense[]): number {
    return Math.floor((total - this.countCategorisedExpenses(expenses)) / this.countDaysDiff(dateStart, dateEnd));
  }

  public isTotalValid (total: number, dateStart: Timestamp, dateEnd: Timestamp, expenses: IExpense[]): number {
    const dailySpend = this.getUncategorisedSpend(expenses);
    return Math.floor((total - this.countCategorisedExpenses(expenses) - (dailySpend.amount - dailySpend.balance) ) / this.countDaysDiff(dateStart, dateEnd));
  }

  public getUpdatedUncategorisedExpenses (total: number, expenses: IExpense[]): any {
    const uncategorisedSpendItem = {
      ...this.getUncategorisedSpend(expenses),
    };
    const uncategorisedSpend = uncategorisedSpendItem.amount - uncategorisedSpendItem.balance;

    const newDailyAmount = total - this.countCategorisedExpenses(expenses);
    const newDailyBalance = newDailyAmount - uncategorisedSpend;
    
    return { expenseId: uncategorisedSpendItem.id, newAmount: newDailyAmount, newBalance: newDailyBalance}
  }

  public isExpenseAmountValid(budget: IBudget, newAmount: number, oldAmount: number) {
    const uncategorisedSpendObject = this.getUncategorisedSpend(budget.expenses);
    const currentTotalDailySpend = uncategorisedSpendObject.amount - uncategorisedSpendObject.balance;

    const plannedSpend = this.countCategorisedExpenses(budget.expenses);
    const daysDiff = this.countDaysDiff(budget.dateStart, budget.dateEnd);
    const amountLeft = budget.total - plannedSpend + oldAmount - newAmount - currentTotalDailySpend;
    const dailyWithUncategorisedSpend = amountLeft / daysDiff;

    console.log('uncategorisedSpendObject', uncategorisedSpendObject);
    console.log('currentTotalDailySpend', currentTotalDailySpend);
    console.log('plannedSpend', plannedSpend);
    console.log('daysDiff', daysDiff);
    console.log('newAmount', newAmount);
    console.log('oldAmount', oldAmount);
    console.log('amountLeft', amountLeft);
    console.log('dailyWithUncategorisedSpend', dailyWithUncategorisedSpend);
    
    if (dailyWithUncategorisedSpend >= 0) {
      return true;
    }
    return false;
  }
}
