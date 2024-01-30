import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  constructor(
    private snackBar: MatSnackBar,
    private translateService: TranslateService,
  ) {}
 
  public showSuccess(key: string): void {
    this.snackBar.open(this.translateService.instant(key), '', {
      duration: 5000,
      panelClass: 'success-snackbar',
    });
  }

  public showError(key: string): void {
    this.snackBar.open(this.translateService.instant(key), '', {
      duration: 5000,
      panelClass: 'error-snackbar',
    });
  } 

  public showMessage(key: string, action: string, duration: number): void {
    this.snackBar.open(this.translateService.instant(key), action, {
      duration,
    });
  }
}
