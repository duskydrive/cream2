import { Injectable, inject } from '@angular/core';
import { from, of, switchMap } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    private auth: Auth = inject(Auth);
    private firestore: Firestore = inject(Firestore);
    
    constructor() {}

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
						switchMap(() => of(userCredential))
					);
				}),
			);
    }

    signIn(email: string, password: string) {
			console.log('signIn');
			return from(signInWithEmailAndPassword(this.auth, email, password));
    }

    signOut() {
			return from(signOut(this.auth));
    }

    getAuthStatus() {
			return authState(this.auth);
    }
 }