import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { Observable, map } from 'rxjs';

import { Unsub } from './core/classes/unsub';

import { Store, select } from '@ngrx/store';
import { ISpinnerState } from './store/spinner/spinner.state';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends Unsub implements OnInit {
  public isLoading$: Observable<boolean>;

  constructor(
    private translate: TranslateService,
    private store: Store<{ spinner: ISpinnerState }>
  ) {
    super();

    this.isLoading$ = this.store.pipe(
      select('spinner'),
      map(state => state.activeRequests > 0)
    );
  }

  private switchLanguage(language: string) {
    this.translate.use(language);
  }

  public ngOnInit() {}
}
