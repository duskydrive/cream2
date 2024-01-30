import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormHelpersService {

  public getError(control: AbstractControl): any {
    return control ? this.checkForErrorsIn(control) : { key: '' };
  }

  public checkForErrorsIn(formControl: AbstractControl): any {
    if (formControl.hasError('required')) {
      return { key: 'errors.required' };
    }

    if (formControl.hasError('email')) {
      return { key: 'errors.email' };
    }

    if (formControl.hasError('min')) {
      const error = formControl.getError('min');
      return { key: 'errors.min', value: error.min };
    }

    return '';
  }
}
