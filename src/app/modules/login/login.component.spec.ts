import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule, FormBuilder } from '@angular/forms';
import { LoginComponent } from './login.component';
import { StoreModule, Store } from '@ngrx/store';
import { AppState } from 'src/app/store';
import * as UserActions from 'src/app/store/user/user.actions';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let store: Store<AppState>;
  let dispatchSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginComponent ],
      imports: [
        FormsModule,
        ReactiveFormsModule,
        StoreModule.forRoot({}),
        TranslateModule.forRoot(),
      ],
      providers: [
        FormBuilder,
        provideMockStore({ initialState: {} })
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    dispatchSpy = spyOn(store, 'dispatch');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loginForm should be initialized with empty email and password', () => {
    const loginForm = component.loginForm;
    expect(loginForm.get('email')?.value).toEqual('');
    expect(loginForm.get('password')?.value).toEqual('');
    expect(loginForm.valid).toBeFalsy();
  });

  it('should dispatch loginUser action when form is valid and submitted', () => {
    const validEmail = 'test@example.com';
    const validPassword = 'password123';
    component.loginForm.controls['email'].setValue(validEmail);
    component.loginForm.controls['password'].setValue(validPassword);
    
    component.onSubmit();
    expect(dispatchSpy).toHaveBeenCalledWith(
      UserActions.loginUser({ email: validEmail, password: validPassword })
    );
  });

  it('should not dispatch loginUser action when form is invalid', () => {
    component.loginForm.controls['email'].setValue('');
    component.loginForm.controls['password'].setValue('');
    
    component.onSubmit();
    expect(component.loginForm.invalid).toBeTruthy();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should mark all fields as touched when form is invalid and submitted', () => {
    component.onSubmit();
    expect(component.loginForm.get('email')?.touched).toBeTruthy();
    expect(component.loginForm.get('password')?.touched).toBeTruthy();
  });

  // Additional tests can be added as needed
});
