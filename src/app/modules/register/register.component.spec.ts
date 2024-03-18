import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RegisterComponent } from './register.component';
import { Store, StoreModule } from '@ngrx/store';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormHelpersService } from 'src/app/shared/services/form-helpers.service';
import * as UserActions from 'src/app/store/user/user.actions';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let storeSpy: jasmine.SpyObj<any>;
  let store: Store;
  let formHelpersService: FormHelpersService;

  beforeEach(async () => {
    storeSpy = jasmine.createSpyObj('Store', ['dispatch']);
    await TestBed.configureTestingModule({
      declarations: [RegisterComponent],
      imports: [
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        StoreModule.forRoot({})
      ],
      providers: [
        { provide: FormHelpersService, useValue: jasmine.createSpyObj('FormHelpersService', ['functionName']) }, // Mock any functions if needed
        TranslateService,
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    formHelpersService = TestBed.inject(FormHelpersService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid when empty', () => {
    expect(component.registerForm.valid).toBeFalsy();
  });

  it('email field validity', () => {
    let email = component.registerForm.controls['email'];
    expect(email.valid).toBeFalsy();

    email.setValue("");
    expect(email.hasError('required')).toBeTruthy();

    email.setValue("test");
    expect(email.hasError('email')).toBeTruthy();
  });

  it('should dispatch registerUser action on submit', () => {
    spyOn(storeSpy, 'dispatch');
    component.registerForm.controls['email'].setValue('test@test.com');
    component.registerForm.controls['password'].setValue('123456');
    component.registerForm.controls['name'].setValue('Test Name');

    component.onSubmit();

    expect(storeSpy.dispatch).toHaveBeenCalledWith(UserActions.registerUser({ 
      email: 'test@test.com', 
      password: '123456',
      name: 'Test Name'
    }));
  });
});
