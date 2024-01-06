import { Injectable } from '@angular/core';
import { User } from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSource = new BehaviorSubject<User | null>(null);
	currentUser$: Observable<User | null> = this.currentUserSource.asObservable();

  constructor() {}

	setCurrentUser(user: User | null) {
		this.currentUserSource.next(user);
		console.log('userSerivce -> setCurrentUser runs');
		this.currentUser$.subscribe((user) => {
			console.log('this.currentUserSource.next(user); -> ', user)
		})
	}

	getCurrentUser(): Observable<User | null> {
		return this.currentUser$;
	}
}