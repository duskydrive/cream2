import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService } from 'src/app/core/services/user.service';
import { FormHelpersService } from 'src/app/shared/services/form-helpers.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  private authSubscription!: Subscription;
  
  constructor(
    private formBuilder: FormBuilder,
    public formHelpersService: FormHelpersService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
  ) {
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

    this.authSubscription = this.authService.signUp(
      this.registerForm.get('email')!.value,
      this.registerForm.get('password')!.value,
      this.registerForm.get('name')!.value,
    ).subscribe({
      next: (result) => {
        console.log('Signup successful', result);
        this.userService.setCurrentUser(result.user);
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Signup failed', error);
      }
    })
  }
}
