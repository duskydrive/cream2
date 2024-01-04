import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { FormHelpersService } from 'src/app/shared/services/form-helpers.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  private authSubscription!: Subscription;
  
  constructor(
    private formBuilder: FormBuilder,
    public formHelpersService: FormHelpersService,
    private authService: AuthService,
  ) {
    this.loginForm = this.formBuilder.group({
      email: [null, [Validators.required, Validators.email]],
      password: [null, [Validators.required]],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authSubscription = this.authService.signIn(
      this.loginForm.get('email')!.value,
      this.loginForm.get('password')!.value,
    ).subscribe({
      next: (result) => {
        console.log('Signin successful', result);
      },
      error: (error) => {
        console.error('Signin failed', error);
      }
    })
  }
}
