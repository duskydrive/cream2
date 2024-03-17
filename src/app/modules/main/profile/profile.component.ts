import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, filter, take, takeUntil } from 'rxjs';

import { AuthService } from 'src/app/core/services/auth.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { FormHelpersService } from 'src/app/shared/services/form-helpers.service';
import { Unsub } from 'src/app/core/classes/unsub';

import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store';
import * as UserSelectors from 'src/app/store/user/user.selectors';
import * as UserActions from 'src/app/store/user/user.actions';

import { getStorage } from '@angular/fire/storage';
import { Firestore } from '@angular/fire/firestore';
import { LANGUAGES } from 'src/app/app.constants';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent extends Unsub implements OnInit {
  public profileForm: FormGroup;
  public userName!: string | null;
  public userEmail!: string | null;
  public userPhoto$!: Observable<string | null>;
  private storage = getStorage();
  private firestore: Firestore = inject(Firestore);
  private uid!: string;
  protected LANGUAGES = LANGUAGES;
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private store: Store<AppState>,
    private snackbarService: SnackbarService,
    public formHelpersService: FormHelpersService,
  ) {
    super();


    this.profileForm = this.formBuilder.group({
      name: [ '', [Validators.required]],
      password: [ '', [Validators.minLength(6)]],
    });
  }

  public ngOnInit() {
    this.initializeUserSubscriptions();

    this.store.select(UserSelectors.selectUserId).pipe(
      filter((userId: string | null): userId is string => !!userId),
      take(1),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (userId: string) => {
        this.uid = userId;
      }
    });
  }

  private initializeUserSubscriptions() {
    this.store.select(UserSelectors.selectUserName).pipe(
      takeUntil(this.destroy$),
    ).subscribe((name: string | null) => {
      this.userName = name;
      this.getFormControl('name').setValue(name);
    });

    this.store.select(UserSelectors.selectUserEmail).pipe(
      takeUntil(this.destroy$),
    ).subscribe((email: string | null) => {
      this.userEmail = email;
    });
    
    this.userPhoto$ = this.store.select(UserSelectors.selectUserPhoto).pipe(
      takeUntil(this.destroy$),
    );
  }

  public getFormControl(name: string): AbstractControl {
    return this.profileForm.get(name) as AbstractControl;
  }

  public onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length) {
      const file: File = input.files[0];

      this.store.dispatch(UserActions.uploadUserPhoto({ userId: this.uid, file }));
    }
  }

  public changeLang(language: string) {
    this.store.dispatch(UserActions.changeLanguage({ language }))
  }

  public onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
  
    const newName = this.getFormControl('name').value;
    const newPassword = this.getFormControl('password').value;

    if (newPassword) {
      this.store.dispatch(UserActions.updateUserCreds({ name: newName, password: newPassword }));
    } else {
      this.store.dispatch(UserActions.updateUserCreds({ name: newName }));
    }
  }
}
