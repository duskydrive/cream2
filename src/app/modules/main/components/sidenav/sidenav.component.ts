import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { Observable, takeUntil } from 'rxjs';

import { MatSidenav } from '@angular/material/sidenav';
import { BreakpointObserver, BreakpointState,  } from '@angular/cdk/layout';

import { AuthService } from 'src/app/core/services/auth.service';
import { Unsub } from 'src/app/core/classes/unsub';

import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store';
import * as UserSelectors from 'src/app/store/user/user.selectors';
import * as SpinnerActions from 'src/app/store/spinner/spinner.actions';
import { LocalStorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavComponent extends Unsub implements OnInit, AfterViewInit {
  public userName$!: Observable<string | null>;
  public userPhoto$!: Observable<string | null>;
  public isLargeScreen!: boolean;

  @ViewChild('sidenav') sidenav!: MatSidenav;

  constructor(
    private authService: AuthService,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private cdr: ChangeDetectorRef,
    private store: Store<AppState>,
    private localStorageService: LocalStorageService,
  ) {
    super();
  }

  public ngOnInit() {
    this.userName$ = this.store.select(UserSelectors.selectUserName);
    this.userPhoto$ = this.store.select(UserSelectors.selectUserPhoto);
  }
  
  public ngAfterViewInit() {
    this.breakpointObserver.observe([
      '(min-width: 1024px)',
    ]).subscribe((result: BreakpointState) => {
      if (result.matches) {
        this.isLargeScreen = true;
        this.sidenav.mode = 'side';
        this.sidenav.open();
      } else {
        this.isLargeScreen = false;
        this.sidenav.mode = 'over';
      }

      this.cdr.detectChanges();
    });
  }

  public toggleSidenav() {
    this.sidenav.toggle();
  }

  public closeSidenavIfMobile(): void {
    if (!this.isLargeScreen) {
      this.sidenav.close();
    }
  }

  public logout() {
    this.store.dispatch(SpinnerActions.startRequest());

    this.authService.signOut().pipe(
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.store.dispatch(SpinnerActions.endRequest());
      this.localStorageService.clear();
      this.router.navigate(['/login']);
    });
  }
}
