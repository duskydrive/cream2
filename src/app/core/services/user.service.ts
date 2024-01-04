import { Injectable, inject } from '@angular/core';
import { User } from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSource = new BehaviorSubject<User | null>(null);
	currentUser = this.currentUserSource.asObservable();

  constructor() {}

	setCurrentUser(user: User) {
		this.currentUserSource.next(user);
	}
}