import { Injectable } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { Unsub } from '../classes/unsub';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class FileService extends Unsub {
  private storage = getStorage();
	
	constructor() {
		super();
	}

	public uploadImage(userId: string, file: File) {
    const filePath = `avatars/${userId}/${file.name}`;
    const fileRef = ref(this.storage, filePath);

    return from(uploadBytes(fileRef, file)).pipe(
			switchMap(() => getDownloadURL(fileRef)),
		);
  }
 }