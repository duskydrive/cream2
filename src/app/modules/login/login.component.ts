import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { FormHelpersService } from 'src/app/shared/services/form-helpers.service';
import { takeUntil } from 'rxjs';
import { UserService } from 'src/app/core/services/user.service';
import { Router } from '@angular/router';
import { Unsub } from 'src/app/core/classes/unsub';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent extends Unsub {
  loginForm: FormGroup;
  
  constructor(
    private formBuilder: FormBuilder,
    public formHelpersService: FormHelpersService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
  ) {
    super();

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

    this.authService.signIn(
      this.loginForm.get('email')!.value,
      this.loginForm.get('password')!.value,
    ).pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: (result) => {
        console.log('Signin successful', result);
        this.userService.setCurrentUser(result.user);
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Signin failed', error);
      }
    })
  }
}
