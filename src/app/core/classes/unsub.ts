import { Injectable, OnDestroy } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
  providedIn: 'root'
})

export abstract class Unsub implements OnDestroy {
  protected destroy$ = new Subject<void>;

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}