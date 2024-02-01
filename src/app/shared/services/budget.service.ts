import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, catchError, combineLatest, concatMap, forkJoin, from, map, of, switchMap, tap } from 'rxjs';
import { collection, collectionData, doc, docData, DocumentReference, Firestore, orderBy, query, setDoc, updateDoc, writeBatch } from '@angular/fire/firestore';
import { IBudget, IBudgetPayload, IExpense, IExpensePayload } from '../models/budget.interface';
import { IBudgetTitleAndId } from 'src/app/core/models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private firestore: Firestore = inject(Firestore);
  
  public createBudget(userId: string, budget: IBudgetPayload, expenses: IExpensePayload[]): Observable<IBudget> {
    const budgetDocRef = doc(collection(this.firestore, `users/${userId}/budgets`));
    const addBudget$ = from(setDoc(budgetDocRef, budget));
		
    const expensesChain$ = this.addExpensesToBudget(budgetDocRef, expenses);

    return this.finalizeBudgetCreation(addBudget$, expensesChain$, budget, budgetDocRef.id);
  }


  private addExpensesToBudget(budgetDocRef: DocumentReference, expenses: IExpensePayload[]): Observable<IExpense[]> {
    const expenseObservables = expenses.map(expense => {
      const expenseDocRef = doc(collection(this.firestore, `${budgetDocRef.path}/expenses`));
      const expenseWithId = {
        ...expense,
        id: expenseDocRef.id,
      };
      console.log('expenseWithId', expenseWithId)
      return from(setDoc(expenseDocRef, expenseWithId)).pipe(
        map(() => expenseWithId)
      );
    });
  
    return forkJoin(expenseObservables);
  }

  private finalizeBudgetCreation(addBudget$: Observable<void>, expensesChain$: Observable<IExpense[]>, budget: IBudgetPayload, budgetId: string): Observable<IBudget> {
    return addBudget$.pipe(
        concatMap(() => expensesChain$),
        map(expensesWithId => ({
            ...budget,
            expenses: expensesWithId,
            id: budgetId,
        }))
    );
}

public getBudget(userId: string, budgetId: string): Observable<any> {
  const budgetDocRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}`);

  alert('getBudget');
  return docData(budgetDocRef).pipe(
    switchMap(budget => {
      if (!budget) return from([]);
      alert('1 getBudget inside switchMap');

      // Create a query for the expenses collection, ordered by 'orderIndex'
      const expensesQuery = query(
        collection(this.firestore, `users/${userId}/budgets/${budgetId}/expenses`),
        orderBy('orderIndex')
      );

      // Fetch the data using the query
      return combineLatest([of(budget), collectionData(expensesQuery, { idField: 'id' })]);
    }),
    map(([budget, expenses]) => {
      alert('2 getBudget inside map');
      if (!budget) return null;
      return { 
        ...budget, 
        id: budgetId,
        expenses,
      };
    })
  );
}

  public getBudgetsTitlesAndIds(userId: string): Observable<IBudgetTitleAndId[]> {
    const budgetsCol = collection(this.firestore, `users/${userId}/budgets`);
    return collectionData(budgetsCol, { idField: 'id' }).pipe(
      map(budgets => budgets.map(budget => ({ 
        id: budget.id,
        title: budget['title'],
      }))),
    )
  }

  // public updateExpensesOrder(userId: string, budgetId: string, expenses: IExpense[]): Observable<any> {
  //   alert('updateExpensesOrder')
  //   const batch = writeBatch(this.firestore);

  //   expenses.forEach(expense => {
  //     const expenseRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}/expenses/${expense.id}`);
  //     batch.update(expenseRef, { orderIndex: expense.orderIndex });
  //   });
    
  //   return from(batch.commit());
  // }
  // public updateExpensesOrder(userId: string, budgetId: string, expenses: IExpense[]): Observable<void> {
  //   console.log('updateExpensesOrder expenses:', expenses)
  //   const updateObservables: Observable<any>[] = [];

  //   expenses.forEach(expense => {
  //     if (expense.id) {
  //       const expenseRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}/expenses/${expense.id}`);
  //       const updateObservable = from(updateDoc(expenseRef, { orderIndex: expense.orderIndex }));
  //       updateObservables.push(updateObservable);
  //     }
  //   });

  //   console.log('budgetService -> updateExpensesOrder');

  //   // Execute all update operations and wait for them to complete
  //   return updateObservables.length > 0 ? forkJoin(updateObservables).pipe(map(() => {})) : of(void 0);
  // }
  public updateExpensesOrder(userId: string, budgetId: string, expenses: IExpense[]): Observable<any> {
    alert('1 updateExpensesOrder')
    const batch = writeBatch(this.firestore);
    alert('2 updateExpensesOrder')
    expenses.forEach(expense => {
      const expenseRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}/expenses/${expense.id}`);
      batch.update(expenseRef, { orderIndex: expense.orderIndex });
    });
    alert('3 updateExpensesOrder')
    
    return from(batch.commit());
  }
  
}
