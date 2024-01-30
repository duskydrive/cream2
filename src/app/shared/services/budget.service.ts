import { Injectable, inject } from '@angular/core';
import { Observable, concatMap, forkJoin, from, map } from 'rxjs';
import { collection, collectionData, doc, docData, DocumentReference, Firestore, setDoc } from '@angular/fire/firestore';
import { IBudget, IBudgetPayload, IExpense } from '../models/budget.interface';
import { IBudgetTitleAndId } from 'src/app/core/models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private firestore: Firestore = inject(Firestore);
  
  public createBudget(userId: string, budget: IBudgetPayload, expenses: IExpense[]): Observable<IBudget> {
    const budgetDocRef = doc(collection(this.firestore, `users/${userId}/budgets`));
    const addBudget$ = from(setDoc(budgetDocRef, budget));
		
    const expensesChain$ = this.addExpensesToBudget(budgetDocRef, expenses);

    return this.finalizeBudgetCreation(addBudget$, expensesChain$, budget, expenses);
  }


  private addExpensesToBudget(budgetDocRef: DocumentReference, expenses: IExpense[]): Observable<void[]> {
    const expenseObservables = expenses.map((expense: any) => {
			const expenseDocRef = doc(collection(this.firestore, `${budgetDocRef.path}/expenses`));
			return from(setDoc(expenseDocRef, expense));
		});

    return forkJoin(expenseObservables);
  }

  private finalizeBudgetCreation(addBudget$: Observable<void>, expensesChain$: Observable<void[]>, budget: IBudgetPayload, expenses: IExpense[]): Observable<IBudget> {
    return addBudget$.pipe(
        concatMap(() => expensesChain$),
        map(() => ({...budget, expenses}))
    );
  }

  public getBudget(userId: string, budgetId: string): any {
    const budgetDocRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}`);
    return docData(budgetDocRef);
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
  
}
