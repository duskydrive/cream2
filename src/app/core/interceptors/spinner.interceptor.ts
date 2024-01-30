import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as SpinnerActions from '../../store/spinner/spinner.actions';

@Injectable()
export class SpinnerInterceptor implements HttpInterceptor {
  constructor(
    private store: Store,
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    this.store.dispatch(SpinnerActions.startRequest());

    return next.handle(request).pipe(
      finalize(() => this.store.dispatch(SpinnerActions.endRequest())),
    );
  }
}
