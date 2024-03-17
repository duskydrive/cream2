import { Injectable, inject } from '@angular/core';
import { Observable, from, of, switchMap, takeUntil } from 'rxjs';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, authState, updateProfile, UserCredential, User} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Unsub } from '../classes/unsub';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store';
import * as UserActions from 'src/app/store/user/user.actions';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends Unsub {
	private auth: Auth = inject(Auth);
	private firestore: Firestore = inject(Firestore);
	
	constructor(
		private store: Store<AppState>,
	) {
		super();

		this.monitorAuthState();
	}

	private monitorAuthState() {
		authState(this.auth).pipe(
			takeUntil(this.destroy$),
		).subscribe((user: User | null) => {
			this.store.dispatch(UserActions.setUser({ user: {
				userId: user?.uid || null,
				name: user?.displayName || null,
				email: user?.email || null,
				photo: user?.photoURL || null,
			} }));
		});
	}

	public signUp(email: string, password: string, name: string): Observable<UserCredential> {
		return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
			switchMap((userCredential: UserCredential) => {
				return from(updateProfile(userCredential.user, {
					displayName: name,
				})).pipe(
					switchMap(() => {						
						const userDocRef = doc(this.firestore, `users/${userCredential.user.uid}`);
						return from(setDoc(userDocRef, {
							email: email,
							name: name
						}));
					}),
					switchMap(() => of(userCredential)),
					takeUntil(this.destroy$),
				);
			}),
		);
	}

	public signIn(email: string, password: string): Observable<UserCredential> {
		return from(signInWithEmailAndPassword(this.auth, email, password));
	}

	public signOut() {
		return from(signOut(this.auth));
	}

	public getAuthState(): Observable<User | null> {
		return authState(this.auth);
	}
 }