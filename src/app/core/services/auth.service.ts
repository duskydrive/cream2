import { Injectable, inject } from '@angular/core';
import { from, of, switchMap, takeUntil } from 'rxjs';
import { 
	Auth, 
	createUserWithEmailAndPassword, 
	signInWithEmailAndPassword, 
	signOut, 
	authState, 
	updateProfile,
 } from '@angular/fire/auth';
import { 
	Firestore, 
	collection, 
	doc, 
	setDoc,
 } from '@angular/fire/firestore';
import { UserService } from './user.service';
import { Unsub } from '../classes/unsub';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends Unsub {
	private auth: Auth = inject(Auth);
	private firestore: Firestore = inject(Firestore);
	
	constructor(
		private userService: UserService,
	) {
		super();

		this.monitorAuthState();
	}

	private monitorAuthState() {
		// TODO check if its ok or should delete
		authState(this.auth).pipe(
			takeUntil(this.destroy$),
		).subscribe(user => {
			this.userService.setCurrentUser(user);
		});
	}

	signUp(email: string, password: string, name: string) {
		return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
			switchMap((userCredential) => {
				return from(updateProfile(userCredential.user, {
					displayName: name,
				})).pipe(
					switchMap(() => {
						const usersCollection = collection(this.firestore, 'users');
						return from(setDoc(doc(usersCollection), {
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

	signIn(email: string, password: string) {
		console.log('auth.service -> signIn');
		return from(signInWithEmailAndPassword(this.auth, email, password));
	}

	signOut() {
		return from(signOut(this.auth)).pipe(
			switchMap(() => {
				this.userService.setCurrentUser(null);
				return of(true);
			}),
			takeUntil(this.destroy$),
		);
	}

	getAuthStatus() {
		return authState(this.auth);
	}
 }