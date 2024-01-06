import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs';
import { Unsub } from 'src/app/core/classes/unsub';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent extends Unsub {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    super();
  }
  
  logout() {
    this.authService.signOut().pipe(
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
