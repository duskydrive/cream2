import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormHelpersService {

  checkForErrorsIn(formControl: AbstractControl): string {
    if (formControl.hasError('required')) {
      return 'errors.required';
    }

    if (formControl.hasError('email')) {
      return 'errors.email';
    }

    return '';
  }
}
