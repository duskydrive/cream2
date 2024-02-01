import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, catchError, combineLatest, concatMap, forkJoin, from, map, of, switchMap, tap } from 'rxjs';
import { collection, collectionData, doc, docData, DocumentReference, Firestore, getDoc, getDocs, orderBy, query, setDoc, updateDoc, writeBatch } from '@angular/fire/firestore';
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

// public getBudget(userId: string, budgetId: string): Observable<any> {
//   const budgetDocRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}`);

//   return docData(budgetDocRef).pipe(
//     switchMap(budget => {
//       if (!budget) return from([]);
//       // Create a query for the expenses collection, ordered by 'orderIndex'
//       const expensesQuery = query(
//         collection(this.firestore, `users/${userId}/budgets/${budgetId}/expenses`),
//         orderBy('orderIndex')
//       );

//       // Fetch the data using the query
//       return combineLatest([of(budget), collectionData(expensesQuery, { idField: 'id' })]);
//     }),
//     map(([budget, expenses]) => {
//       if (!budget) return null;
//       return { 
//         ...budget, 
//         id: budgetId,
//         expenses,
//       };
//     })
//   );
// }
// public getBudget(userId: string, budgetId: string): Observable<any> {
//   const budgetDocRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}`);
//   alert('service -> enter getBudget');
//   return docData(budgetDocRef).pipe(
//     switchMap(budget => {
//       alert('service -> 1 inside switchMap');
//       if (!budget) return of(null);

//       // Create a query for the expenses collection, ordered by 'orderIndex'
//       const expensesQuery = query(
//         collection(this.firestore, `users/${userId}/budgets/${budgetId}/expenses`),
//         orderBy('orderIndex')
//       );

//       // Fetch the data using the query (one-time fetch)
//       return from(getDocs(expensesQuery)).pipe(
//         map(querySnapshot => {
//           const expenses = querySnapshot.docs
//           .map(doc => ({ id: doc.id, ...doc.data() }));
//           alert('service -> 2 inside map');
//           return { ...budget, id: budgetId, expenses };
//         })
//       );
//     })
//   );
// }
public getBudget(userId: string, budgetId: string): Observable<any> {
  const budgetDocRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}`);
  alert('service -> enter getBudget');
  
  // Only retrieve budget once, no Firestore listeners
  return from(getDoc(budgetDocRef)).pipe(
    switchMap(budgetSnap => {
      if (!budgetSnap.exists()) {
        return of(null);
      }

      // Create a query for the expenses collection, ordered by 'orderIndex'
      const expensesQuery = query(
        collection(this.firestore, `users/${userId}/budgets/${budgetId}/expenses`),
        orderBy('orderIndex')
      );

      // Fetch the data using the query (one-time fetch)
      return from(getDocs(expensesQuery)).pipe(
        map(querySnapshot => {
          const expenses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          alert('service -> 2 inside map');
          return { ...budgetSnap.data(), id: budgetId, expenses };
        })
      );
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

  public updateExpensesOrder(userId: string, budgetId: string, expenses: IExpense[]): Observable<any> {
    const batch = writeBatch(this.firestore);
    expenses.forEach(expense => {
      const expenseRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}/expenses/${expense.id}`);
      batch.update(expenseRef, { orderIndex: expense.orderIndex });
    });
    
    return from(batch.commit());
  }
  
}
