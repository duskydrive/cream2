import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { Observable, filter, map } from 'rxjs';

import { Unsub } from './core/classes/unsub';

import { Store, select } from '@ngrx/store';
import { ISpinnerState } from './store/spinner/spinner.state';
import { NavigationEnd, Router } from '@angular/router';
import { LocalStorageService } from './core/services/storage.service';

import * as UserSelectors from 'src/app/store/user/user.selectors';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends Unsub implements OnInit {
  public isLoading$: Observable<boolean>;
  private currentLang$: Observable<string | null> = this.store.select(UserSelectors.selectLanguage);

  constructor(
    private translate: TranslateService,
    private localStorageService: LocalStorageService,
    private router: Router,
    private store: Store<{ spinner: ISpinnerState }>
  ) {
    super();

    this.isLoading$ = this.store.pipe(
      select('spinner'),
      map(state => state.activeRequests > 0)
    );
  }

  public ngOnInit(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.localStorageService.setItem('lastRoute', event.urlAfterRedirects);
    });

    const lastRoute = this.localStorageService.getItem('lastRoute');
    if (lastRoute) {
      this.router.navigateByUrl(lastRoute);
    }

    this.currentLang$.subscribe((language: any) => {
      this.translate.use(language);
    })
  }
}
