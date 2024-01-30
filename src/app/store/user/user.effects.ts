import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import * as UserActions from './user.actions';
import * as SpinnerActions from '../spinner/spinner.actions';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserCredential } from 'firebase/auth';
import { FirebaseError } from '@angular/fire/app';
import { FileService } from 'src/app/core/services/file.service';
import { getDownloadURL } from '@angular/fire/storage';
import { UserService } from 'src/app/core/services/user.service';

@Injectable()
export class UserEffects {
  constructor(
    private actions$: Actions,
    private store: Store,
    private authService: AuthService,
    private userService: UserService,
    private fileService: FileService,
    private router: Router,
    private snackbarService: SnackbarService,
  ) {}

  loginUser$ = createEffect(() => 
    this.actions$.pipe(
      ofType(UserActions.loginUser),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      switchMap(({ email, password }) => 
        this.authService.signIn(email, password).pipe(
          map((UserCredential: UserCredential) => {
            this.snackbarService.showSuccess('success_login');
            this.router.navigate(['/']);
            return UserActions.loginUserSuccess({ 
              user: {
                userId: UserCredential.user?.uid,
                name: UserCredential.user?.displayName,
                email: UserCredential.user?.email,
                photo: UserCredential.user?.photoURL,
              }
            });
          }),
          catchError((error: FirebaseError) => {
            this.snackbarService.showError(error.code || 'login_error');
            return of(UserActions.loginUserFailure({ error }));
          }),
        ),
      ),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())) 
    ),
  );

  registerUser$ = createEffect(() => 
    this.actions$.pipe(
      ofType(UserActions.registerUser),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      switchMap(({ email, password, name }) => 
        this.authService.signUp(email, password, name).pipe(
          map((UserCredential: UserCredential) => {
            this.snackbarService.showSuccess('success_registration');
            this.router.navigate(['/']);
            return UserActions.registerUserSuccess( { user: {
              userId: UserCredential.user?.uid,
              name: UserCredential.user?.displayName,
              email: UserCredential.user?.email,
              photo: UserCredential.user?.photoURL,
            }});
          }),
          catchError((error: FirebaseError) => {
            this.snackbarService.showError(error.code || 'registration_error');
            return of(UserActions.registerUserFailure( { error: error }));
          }),
        ),
      ),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())) 
    ),
  );

  uploadUserPhoto$ = createEffect(() => 
    this.actions$.pipe(
      ofType(UserActions.uploadUserPhoto),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      switchMap(({ userId, file }) => this.fileService.uploadImage(userId, file)),
      switchMap((snapshot) => getDownloadURL(snapshot.ref)),
      map((photoUrl: string) => {
        this.snackbarService.showSuccess('photo_uploaded');
        return UserActions.uploadUserPhotoSuccess({ photoUrl });
      }),
      catchError((error: FirebaseError) => {
        this.snackbarService.showError(error.code || 'photo_upload_error');
        return of(UserActions.uploadUserPhotoFailure( { error: error }));
      }),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())) 
    ),
  );

  updateUserCreds$ = createEffect(() => 
    this.actions$.pipe(
      ofType(UserActions.updateUserCreds),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      switchMap(({ name, password }) => {
        const passwordUpdate$: Observable<any> = password 
        ? this.userService.updateUserPassword(password)
        : of(null);

        return passwordUpdate$.pipe(
          switchMap(() => this.userService.updateUserName(name)),
          map(() => UserActions.updateUserCredsSuccess({ name })),
        );
      }),
      map(({ name }) => {
        this.snackbarService.showSuccess('update_creds_success');
        return UserActions.updateUserCredsSuccess({ name });
      }),
      catchError((error: FirebaseError) => {
        this.snackbarService.showError(error.code || 'update_creds_failure');
        return of(UserActions.updateUserCredsFailure( { error: error }));
      }),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())) 
    ),
  );
}