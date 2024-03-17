import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { FormHelpersService } from 'src/app/shared/services/form-helpers.service';
import { Unsub } from 'src/app/core/classes/unsub';

import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store';
import * as UserActions from 'src/app/store/user/user.actions';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent extends Unsub {
  public loginForm: FormGroup;
  
  constructor(
    private formBuilder: FormBuilder,
    private store: Store<AppState>,
    public formHelpersService: FormHelpersService,
  ) {
    super();

    this.loginForm = this.formBuilder.group({
      email: [ '', [Validators.required, Validators.email]],
      password: [ '', [Validators.required]],
    });
  }

  public onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.store.dispatch(UserActions.loginUser({ email: this.loginForm.get('email')!.value, password: this.loginForm.get('password')!.value} ));
  }
}
