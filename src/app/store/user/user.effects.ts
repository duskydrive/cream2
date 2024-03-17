import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, Observable, catchError, first, from, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import * as UserActions from './user.actions';
import * as SpinnerActions from '../spinner/spinner.actions';
import * as UserSelectors from '../user/user.selectors';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserCredential, updateProfile } from 'firebase/auth';
import { FirebaseError } from '@angular/fire/app';
import { FileService } from 'src/app/core/services/file.service';
import { UserService } from 'src/app/core/services/user.service';
import { LocalStorageService } from 'src/app/core/services/storage.service';

@Injectable()
export class UserEffects {
  constructor(
    private actions$: Actions,
    private store: Store,
    private authService: AuthService,
    private userService: UserService,
    private fileService: FileService,
    private localStorageService: LocalStorageService,
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
      switchMap(({ file }) => 
        this.authService.getAuthState().pipe(
          first(),
          switchMap((user) => {
            if (!user) throw new Error('user_not_logged');
            return this.fileService.uploadImage(user.uid, file).pipe(
              switchMap((photoUrl: string) => {
                return from(updateProfile(user, { photoURL: photoUrl })).pipe(
                  map(() => photoUrl)
                );
              })
            );
          }),
          map((photoUrl: string) => {
            this.snackbarService.showSuccess('photo_upload_success');
            return UserActions.uploadUserPhotoSuccess({ photoUrl });
          }),
          catchError((error: any) => {
            this.snackbarService.showError(error.message || 'photo_upload_error');
            return of(UserActions.uploadUserPhotoFailure({ error }));
          }),
          tap(() => this.store.dispatch(SpinnerActions.endRequest()))
        )
      )
    )
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

  changeLanguageAction$ = createEffect(() => 
    this.actions$.pipe(
      ofType(UserActions.changeLanguage),
      tap(() => this.store.dispatch(SpinnerActions.startRequest())),
      switchMap((language) => {
        this.localStorageService.setItem('userLanguage', language.language);
        return of(UserActions.changeLanguageSuccess({ language: language.language }));
      }),
      tap(() => this.store.dispatch(SpinnerActions.endRequest())),
    )
  );

  setLanguageFromLocalStorage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.setUser),
      withLatestFrom(this.store.select(UserSelectors.selectLanguage)),
      switchMap(( [{user}, language] ) => {
        if (user.userId && this.localStorageService.hasKey('userLanguage')) {
          const localStorageLanguage = this.localStorageService.getItem('userLanguage')!;
          if (language === localStorageLanguage) {
            return EMPTY;
          }
          return of(UserActions.changeLanguage({ language: localStorageLanguage }))
        } else {
          this.localStorageService.setItem('userLanguage', 'en');
        }
        return EMPTY;
      }),
    )
  );
}