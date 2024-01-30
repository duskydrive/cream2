import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { FormHelpersService } from 'src/app/shared/services/form-helpers.service';
import { Unsub } from 'src/app/core/classes/unsub';

import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store';
import * as UserActions from 'src/app/store/user/user.actions';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent extends Unsub {
  public registerForm: FormGroup;

  constructor(
    public formHelpersService: FormHelpersService,
    private store: Store<AppState>,
    private formBuilder: FormBuilder,
  ) {
    super();

    this.registerForm = this.formBuilder.group({
      email: [null, [Validators.required, Validators.email]],
      name: [null, [Validators.required]],
      password: [null, [Validators.required]],
    });
  }

  public onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.store.dispatch(UserActions.registerUser({ 
      email: this.registerForm.get('email')!.value, 
      password: this.registerForm.get('password')!.value,
      name: this.registerForm.get('name')!.value,
    }));
  }
}
