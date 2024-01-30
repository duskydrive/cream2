import { Injectable, inject } from '@angular/core';
import { Observable, from, of, switchMap, takeUntil } from 'rxjs';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, authState, updateProfile, UserCredential, User} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Unsub } from '../classes/unsub';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store';
import * as UserActions from 'src/app/store/user/user.actions';
import { IUserData } from '../models/interfaces';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class FileService extends Unsub {
	private firestore: Firestore = inject(Firestore);
  private storage = getStorage();
	
	constructor(
		private store: Store<AppState>,
	) {
		super();
	}

	
	public uploadImage(userId: string, file: File) {
    const filePath = `avatars/${userId}/${file.name}`;
    const fileRef = ref(this.storage, filePath);

    return from(uploadBytes(fileRef, file));
  }
 }