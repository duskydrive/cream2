import { Injectable, inject } from '@angular/core';
import { Observable, catchError, concatMap, forkJoin, from, map, of, switchMap, tap} from 'rxjs';
import { collection, deleteDoc, doc, DocumentReference, Firestore, getDoc, getDocs, orderBy, query, setDoc, Timestamp, updateDoc, where, writeBatch } from '@angular/fire/firestore';
import { IBudget, IExpense, ISpend } from '../models/budget.interface';
import { IBudgetTitleAndId } from 'src/app/core/models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private firestore: Firestore = inject(Firestore);
  
  public createBudget(userId: string, budget: Omit<IBudget, 'id' | 'expenses'>, expenses: Omit<IExpense, 'id'>[]): Observable<IBudget> {
    const budgetDocRef = doc(collection(this.firestore, `users/${userId}/budgets`));
    const addBudget$ = from(setDoc(budgetDocRef, budget));
		
    const expensesChain$ = this.addExpensesToBudget(budgetDocRef, expenses);

    return this.finalizeBudgetCreation(addBudget$, expensesChain$, budget, budgetDocRef.id);
  }


  private addExpensesToBudget(budgetDocRef: DocumentReference, expenses: Omit<IExpense, 'id'>[]): Observable<IExpense[]> {
    const expenseObservables = expenses.map(expense => {
      const expenseDocRef = doc(collection(this.firestore, `${budgetDocRef.path}/expenses`));
      const expenseWithId = {
        ...expense,
        id: expenseDocRef.id,
      };
      
      return from(setDoc(expenseDocRef, expenseWithId)).pipe(
        map(() => expenseWithId)
      );
    });
  
    return forkJoin(expenseObservables);
  }

  private finalizeBudgetCreation(addBudget$: Observable<void>, expensesChain$: Observable<IExpense[]>, budget: Omit<IBudget, 'id' | 'expenses'>, budgetId: string): Observable<IBudget> {
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
    return from(getDoc(budgetDocRef)).pipe(
      switchMap(budgetSnap => {
        if (!budgetSnap.exists()) {
          return of(null);
        }

        const expensesQuery = query(
          collection(this.firestore, `users/${userId}/budgets/${budgetId}/expenses`),
          orderBy('orderIndex')
        );

        return from(getDocs(expensesQuery)).pipe(
          map(querySnapshot => {
            const expenses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { ...budgetSnap.data(), id: budgetId, expenses };
          })
        );
      })
    );
  }

  getDailyCategoryId(userId: string, budgetId: string): Observable<string | undefined> {
    console.log('---userId', userId)
    console.log('---budgetId', budgetId)
    // Define the reference to the categories collection within a specific budget
    const categoriesRef = collection(this.firestore, `users/${userId}/budgets/${budgetId}/expenses`);
    // Create a query to find the "Daily" category
    const q = query(categoriesRef, where('title', '==', 'Daily'));

    // Execute the query and convert the Promise to an Observable
    return from(getDocs(q)).pipe(
      map(querySnapshot => {
        console.log('querySnapshot', querySnapshot)
        // Map through documents and return the first matching category ID
        const categories = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('---categories', categories)
        return categories.length > 0 ? categories[0].id : undefined;
      })
    );
  }

  public updateBudget(userId: string, budgetId: string, budgetData: Partial<IBudget>): Observable<any> {
    const budgetDocRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}`);

    return from(updateDoc(budgetDocRef, budgetData)).pipe(
      map(() => ({ budgetData })),
    );
  }

  public getBudgetsTitlesAndIds(userId: string): Observable<IBudgetTitleAndId[]> {
    const budgetsCol = collection(this.firestore, `users/${userId}/budgets`);
    
    return from(getDocs(budgetsCol)).pipe(
      map(querySnapshot => {
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data()['title']
        }));
      })
    );
  }

  public updateExpensesOrder(userId: string, budgetId: string, expenses: IExpense[]): Observable<any> {
    const batch = writeBatch(this.firestore);
    expenses.forEach(expense => {
      const expenseRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}/expenses/${expense.id}`);
      batch.update(expenseRef, { orderIndex: expense.orderIndex });
    });
    
    return from(batch.commit());
  }

  public updateExpenseTitle(userId: string, budgetId: string, expenseId: string, newTitle: string): Observable<any> {
    const expenseRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}/expenses/${expenseId}`);

    return from(updateDoc(expenseRef, { title: newTitle })).pipe(
      switchMap(() =>
        from(getDoc(expenseRef)).pipe(
          map((snapshot) => ({
            expenseId: snapshot.id,
            newTitle: snapshot.exists() ? (snapshot.data() as IExpense).title : '',
          }))
        )
      )
    );
  }

  public updateExpenseAmount(userId: string, budgetId: string, expenseId: string, newAmount: number, newBalance: number): Observable<any> {
    console.log('<--> expenseId', expenseId)
    console.log('<--> newAmount', newAmount)
    console.log('<--> newBalance', newBalance)
    const expenseRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}/expenses/${expenseId}`);

    return from(updateDoc(expenseRef, { amount: newAmount, balance: newBalance })).pipe(
      switchMap(() =>
        from(getDoc(expenseRef)).pipe(
          map((snapshot) => ({
            expenseId: snapshot.id,
            newAmount: snapshot.data()!['amount'],
            newBalance: snapshot.data()!['balance'],
          })),
          tap((value) => console.log('tap val', value)),
        )
      )
    );
  }

  public updateExpenseBalance(userId: string, budgetId: string, expenseId: string, newBalance: number): Observable<any> {
    const expenseRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}/expenses/${expenseId}`);
    
    return from(updateDoc(expenseRef, { balance: newBalance })).pipe(
      switchMap(() =>
        from(getDoc(expenseRef)).pipe(
          map((snapshot) => ({
            expenseId: snapshot.id,
            newBalance: snapshot.data()!['balance'],
          })),
        )
      )
    );
  }

  public deleteExpense(userId: string, budgetId: string, expenseId: string): Observable<any> {
    const expenseRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}/expenses/${expenseId}`);

    return from(deleteDoc(expenseRef));
  }

  public addExpense(userId: string, budgetId: string): Observable<IExpense> {
    const expensesCollectionRef = collection(this.firestore, `users/${userId}/budgets/${budgetId}/expenses`);
    const expenseDocRef = doc(expensesCollectionRef);

    const expensesQuery = query(expensesCollectionRef);
    const getOrderIndex$ = from(getDocs(expensesQuery)).pipe(
      map(querySnapshot => querySnapshot.size + 1),
    );

    return getOrderIndex$.pipe(
      switchMap(orderIndex => {
        const newExpense: Omit<IExpense, 'id'> & { id: string } = {
          id: expenseDocRef.id,
          title: 'New',
          amount: 0,
          balance: 0,
          orderIndex: orderIndex,
        };

        return from(setDoc(expenseDocRef, newExpense)).pipe(
          map(() => newExpense)
        );
      })
    );
  }

  getSpendByDate(userId: string, budgetId: string, date: Date): Observable<any[]> {
    const spendCollectionPath = `users/${userId}/budgets/${budgetId}/spend`;
    const spendCollectionRef = collection(this.firestore, spendCollectionPath);
  
    // Reset the time part of the date to ensure it covers the whole day
    const startDate = new Date(date.setHours(0, 0, 0, 0));
    const endDate = new Date(date.setHours(23, 59, 59, 999));
  
    // Convert dates to Timestamp
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
  
    // Query documents within the date range and order by 'date'
    const q = query(spendCollectionRef, 
                    where('date', '>=', startTimestamp), 
                    where('date', '<=', endTimestamp), 
                    orderBy('date'),
                    orderBy('created_at')); // Orders results by 'date' in ascending order by default
  
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      catchError(error => {
        throw 'Error fetching spend collection by date: ' + error;
      })
    );
  }

  public deleteSpend(userId: string, budgetId: string, spendId: string): Observable<any> {
    const spendRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}/spend/${spendId}`);

    return from(deleteDoc(spendRef));
  }

  public addSpend(userId: string, budgetId: string, date: Date): Observable<ISpend> {
    const spendCollectionRef = collection(this.firestore, `users/${userId}/budgets/${budgetId}/spend`);
    const spendDocRef = doc(spendCollectionRef);
    // const spendQuery = query(spendCollectionRef);

    return this.getDailyCategoryId(userId, budgetId).pipe(
      switchMap(dailyCategoryId => {
        // Assuming getDailyCategoryId returns a string ID or undefined
        console.log('---dailyCategoryId', dailyCategoryId)
        if (!dailyCategoryId) {
          throw new Error('Daily category ID not found');
        }
        console.log('Timestamp.now()', Timestamp.now())

        const spendQuery = query(spendCollectionRef);
        return from(getDocs(spendQuery)).pipe(
          map(querySnapshot => querySnapshot.size + 1),
          switchMap(orderIndex => {
            console.log('---lol')
            const newSpend: Omit<ISpend, 'id'> & { id: string } = {
              id: spendDocRef.id,
              title: '',
              amount: 0,
              date: Timestamp.fromDate(date),
              created_at: Timestamp.now(),
              categoryId: dailyCategoryId, // Set categoryId to the fetched Daily category ID
              // orderIndex, // Use the calculated orderIndex
            };

            // Perform the document creation with the new spend data
            return from(setDoc(spendDocRef, newSpend)).pipe(
              map(() => newSpend) // Return the newSpend object to the subscriber
            );
          })
        );
      })
    );
  }

  public updateSpendTitle(userId: string, budgetId: string, spendId: string, newTitle: string): Observable<any> {
    const spendRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}/spend/${spendId}`);

    return from(updateDoc(spendRef, { title: newTitle })).pipe(
      switchMap(() =>
        from(getDoc(spendRef)).pipe(
          map((snapshot) => ({
            spendId: snapshot.id,
            newTitle: snapshot.exists() ? (snapshot.data() as ISpend).title : '',
          }))
        )
      )
    );
  }

  public updateSpendCategory(userId: string, budgetId: string, spendId: string, newCategory: string): Observable<any> {
    const spendRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}/spend/${spendId}`);

    return from(updateDoc(spendRef, { categoryId: newCategory })).pipe(
      switchMap(() =>
        from(getDoc(spendRef)).pipe(
          map((snapshot) => ({
            spendId: snapshot.id,
            newCategory: snapshot.exists() ? (snapshot.data() as ISpend).categoryId : '',
          }))
        )
      )
    );
  }

  public updateSpendAmount(userId: string, budgetId: string, spendId: string, newAmount: number): Observable<any> {
    const spendRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}/spend/${spendId}`);

    return from(updateDoc(spendRef, { amount: newAmount })).pipe(
      switchMap(() =>
        from(getDoc(spendRef)).pipe(
          map((snapshot) => ({
            spendId: snapshot.id,
            amount: snapshot.exists() ? (snapshot.data() as ISpend).amount : '',
          }))
        )
      )
    );
  }
}
