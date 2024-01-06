import { Component, OnInit, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Auth, authState } from '@angular/fire/auth';
import { takeUntil } from 'rxjs';
import { Unsub } from './core/classes/unsub';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends Unsub implements OnInit {
  private auth: Auth = inject(Auth);
  
  constructor(
    private translate: TranslateService,
  ) {
    super();
  }

  switchLanguage(language: string) {
    this.translate.use(language);
  }

  ngOnInit() {
    authState(this.auth).pipe(
      takeUntil(this.destroy$),
    ).subscribe(user => {
      if (!user) {
        // User is logged out, redirect or handle as needed
        console.log('app -> authState(this.auth) -> User is logged out');
        // Handle logged out state
      } else {
        // User is logged in, continue with the session
        console.log('app -> authState(this.auth) -> User is logged in', user);
        // Handle logged in state
      }
    });
  }
}
