import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs';
import { Unsub } from 'src/app/core/classes/unsub';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService } from 'src/app/core/services/user.service';
import { FormHelpersService } from 'src/app/shared/services/form-helpers.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent extends Unsub {
  registerForm: FormGroup;
  
  constructor(
    private formBuilder: FormBuilder,
    public formHelpersService: FormHelpersService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
  ) {
    super();

    this.registerForm = this.formBuilder.group({
      email: [null, [Validators.required, Validators.email]],
      name: [null, [Validators.required]],
      password: [null, [Validators.required]],
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.authService.signUp(
      this.registerForm.get('email')!.value,
      this.registerForm.get('password')!.value,
      this.registerForm.get('name')!.value,
    ).pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: (result) => {
        console.log('Signup successful', result);
        this.userService.setCurrentUser(result.user);
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Signup failed', error);
      }
    })
  }
}
