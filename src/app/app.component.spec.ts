import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { TranslateService } from '@ngx-translate/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { LocalStorageService } from './core/services/storage.service';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import * as UserSelectors from 'src/app/store/user/user.selectors';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let translateService: jasmine.SpyObj<TranslateService>;
  let localStorageService: jasmine.SpyObj<LocalStorageService>;
  let router: Router;
  let store: MockStore;

  beforeEach(async () => {
    // Mock TranslateService
    const translateSpy = jasmine.createSpyObj('TranslateService', ['use']);

    // Mock LocalStorageService
    const localStorageSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent],
      providers: [
        { provide: TranslateService, useValue: translateSpy },
        { provide: LocalStorageService, useValue: localStorageSpy },
        provideMockStore({ initialState: { spinner: { activeRequests: 0 } } }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
    localStorageService = TestBed.inject(LocalStorageService) as jasmine.SpyObj<LocalStorageService>;
    router = TestBed.inject(Router);
    store = TestBed.inject(MockStore);
  });

  it('should set the language from the store on init', () => {
    const expectedLang = 'en';
    store.overrideSelector(UserSelectors.selectLanguage, expectedLang);
    fixture.detectChanges(); // Triggers ngOnInit()
    expect(translateService.use).toHaveBeenCalledWith(expectedLang);
  });

  it('should navigate to the last route on init if exists', () => {
    const lastRoute = '/some/route';
    spyOn(router, 'navigateByUrl');
    localStorageService.getItem.and.returnValue(lastRoute);
    fixture.detectChanges(); // Triggers ngOnInit()
    expect(router.navigateByUrl).toHaveBeenCalledWith(lastRoute);
  });

  it('should not navigate if no last route saved', () => {
    spyOn(router, 'navigateByUrl');
    localStorageService.getItem.and.returnValue(null);
    fixture.detectChanges(); // Triggers ngOnInit()
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should subscribe and set isLoading$ based on spinner state', (done: DoneFn) => {
    store.setState({ spinner: { activeRequests: 1 } });
    component.isLoading$.subscribe((isLoading) => {
      expect(isLoading).toBeTrue();
      done();
    });
  });

  // Additional tests can be added as needed
});
