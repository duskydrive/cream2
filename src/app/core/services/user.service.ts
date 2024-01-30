import { Injectable, inject } from '@angular/core';
import { Auth, authState, updatePassword, updateProfile } from '@angular/fire/auth';
import { Firestore, collection, doc, setDoc } from '@angular/fire/firestore';
import { User } from 'firebase/auth';
import { BehaviorSubject, Observable, filter, from, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSource = new BehaviorSubject<User | null>(null);
	private currentUser$: Observable<User | null> = this.currentUserSource.asObservable();
	private firestore: Firestore = inject(Firestore);

  constructor(private auth: Auth) {}

	public setCurrentUser(user: User | null) {
		this.currentUserSource.next(user);
	}

	public getCurrentUser(): Observable<User | null> {
		return this.currentUser$;
	}

	public updateUserPassword(password: string): Observable<void> {
		return authState(this.auth).pipe(
			filter((authState: User | null): authState is User => authState !== null),
      switchMap(user => from(updatePassword(user, password))),
		)
  }

	public updateUserName(name: string): Observable<void> {
		return authState(this.auth).pipe(
			filter((authState: User | null): authState is User => authState !== null),
      switchMap(user => {
				return from(updateProfile(user, { displayName: name })).pipe(
					switchMap(() => {
						const usersCollection = collection(this.firestore, 'users');
						const userDocRef = doc(usersCollection, user.uid);
						return from(setDoc(userDocRef, { name }));
					}),
				)}
			),
		)
  }
}