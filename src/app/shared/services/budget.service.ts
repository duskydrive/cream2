import { Injectable, inject } from '@angular/core';
import { Observable, catchError, combineLatest, concatMap, forkJoin, from, map, of, switchMap, tap} from 'rxjs';
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

  public updateBudget(userId: string, budgetId: string, budgetData: Partial<IBudget>): Observable<any> {
    const budgetDocRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}`);

    return from(updateDoc(budgetDocRef, budgetData)).pipe(
      map(() => ({ budgetData })),
    );
  }

  public getBudgetsTitlesAndIds(userId: string, isArchived = false): Observable<IBudgetTitleAndId[]> {
    const budgetsCol = collection(this.firestore, `users/${userId}/budgets`);
    const q = query(budgetsCol, where('isArchived', '==', isArchived));
    
    return from(getDocs(q)).pipe(
      map(querySnapshot => querySnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data()['title']
      })))
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
    const expenseRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}/expenses/${expenseId}`);

    return from(updateDoc(expenseRef, { amount: newAmount, balance: newBalance })).pipe(
      switchMap(() =>
        from(getDoc(expenseRef)).pipe(
          map((snapshot) => ({
            expenseId: snapshot.id,
            newAmount: snapshot.data()!['amount'],
            newBalance: snapshot.data()!['balance'],
          })),
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
                    orderBy('date'));
  
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ISpend))),
      map((arr: ISpend[]) => {
        const data = [...arr];
        return data.sort((a, b) => {
          const dateA = a['created_at'].toDate();
          const dateB = b.created_at.toDate();
          return dateA.getTime() - dateB.getTime();
        });
      }),
      catchError(error => {
        throw 'Error fetching spend collection by date: ' + error;
      })
    );
  }

  getPreviousSpend(userId: string, budgetId: string, date: Date, dailyCategoryId: string): Observable<number> {
    const spendCollectionPath = `users/${userId}/budgets/${budgetId}/spend`;
    const spendCollectionRef = collection(this.firestore, spendCollectionPath);
  
    const startTimestamp = Timestamp.fromDate(new Date(date.setHours(0, 0, 0, 0)));
  
    // TODO make id dynamic
    const q = query(spendCollectionRef, where('date', '<', startTimestamp), where('categoryId', '==', dailyCategoryId), orderBy('date'));
  
    return from(getDocs(q)).pipe(
      map(snapshot => {
        const totalAmount = snapshot.docs.reduce((sum, doc) => sum + doc.data()['amount'], 0);
        return totalAmount; // Return the total sum of amounts
      }),
      catchError(error => {
        throw 'Error fetching previous spend collection: ' + error;
      })
    );
  }
  
  

  public deleteSpend(userId: string, budgetId: string, spendId: string): Observable<any> {
    const spendRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}/spend/${spendId}`);

    return from(deleteDoc(spendRef));
  }

  public addSpend(userId: string, budgetId: string, date: Date, dailyCategoryId: string): Observable<ISpend> {
    const spendCollectionRef = collection(this.firestore, `users/${userId}/budgets/${budgetId}/spend`);
    const spendDocRef = doc(spendCollectionRef);

    const spendQuery = query(spendCollectionRef);
      return from(getDocs(spendQuery)).pipe(
        map(querySnapshot => querySnapshot.size + 1),
        switchMap(orderIndex => {
          const newSpend: Omit<ISpend, 'id'> & { id: string } = {
            id: spendDocRef.id,
            title: '',
            amount: 0,
            date: Timestamp.fromDate(date),
            created_at: Timestamp.now(),
            categoryId: dailyCategoryId, 
          };

          return from(setDoc(spendDocRef, newSpend)).pipe(
            map(() => newSpend),
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

  public findSpendOutOfDateRange(userId: string, budgetId: string, dateStart: Timestamp, dateEnd: Timestamp): Observable<any[]> {
    const spendCollectionRef = collection(this.firestore, `users/${userId}/budgets/${budgetId}/spend`);
  
    // Adjust dateEnd to the start of the day to exclude spends on dateEnd
    const adjustedDateEnd = new Date(dateEnd.toDate());
    adjustedDateEnd.setHours(23, 59, 59, 999); // Set to start of the dateEnd day
  
    // Query for spends before the start date
    const spendsBeforeStartQuery = query(spendCollectionRef, where('date', '<', dateStart));
    const spendsBeforeStart$ = from(getDocs(spendsBeforeStartQuery)).pipe(
      map(querySnapshot => querySnapshot.docs.map(doc => doc.data()))
    );
  
    // Query for spends after the adjusted end date
    // Use the Firestore Timestamp for the adjusted end date
    const adjustedEndTimestamp = Timestamp.fromDate(adjustedDateEnd);
    const spendsAfterEndQuery = query(spendCollectionRef, where('date', '>', adjustedEndTimestamp));
    const spendsAfterEnd$ = from(getDocs(spendsAfterEndQuery)).pipe(
      map(querySnapshot => querySnapshot.docs.map(doc => doc.data()))
    );
  
    return combineLatest([spendsBeforeStart$, spendsAfterEnd$]).pipe(
      map(([before, after]) => [...before, ...after])
    );
  }

  public addFix(userId: string, budgetId: string, date: Timestamp, dailyCategoryId: string): Observable<ISpend> {
    const spendCollectionRef = collection(this.firestore, `users/${userId}/budgets/${budgetId}/spend`);
    const spendDocRef = doc(spendCollectionRef);

    const spendQuery = query(spendCollectionRef);
      return from(getDocs(spendQuery)).pipe(
        map(querySnapshot => querySnapshot.size + 1),
        switchMap(orderIndex => {
          const newSpend: Omit<ISpend, 'id'> & { id: string } = {
            id: spendDocRef.id,
            title: 'Fix',
            amount: 0,
            date,
            created_at: Timestamp.now(),
            categoryId: dailyCategoryId, 
          };

          return from(setDoc(spendDocRef, newSpend)).pipe(
            map(() => newSpend),
          );
        })
      );
  }
}
