import { NgModule } from '@angular/core';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { SpinnerInterceptor } from './core/interceptors/spinner.interceptor';

import { AppComponent } from './app.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { AppRoutingModule } from './app-routing.module';
import { LoginModule } from './modules/login/login.module';

import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatIconRegistry } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { SETTINGS as FIRESTORE_SETTINGS } from '@angular/fire/compat/firestore';
import { firebaseConfig } from './environments/environment';

import { StoreModule } from '@ngrx/store';
import { reducers } from './store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { AppEffectsModule } from './app.effects';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, '../assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    SpinnerComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    HttpClientModule,    
    LoginModule,
    // Maybe should be in shared or core?
    TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useFactory: (createTranslateLoader),
          deps: [HttpClient]
      }
    }),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    StoreModule.forRoot(reducers),
    AppEffectsModule,
    // TODO it should be: !environment.production ? StoreDevtoolsModule.instrument() : []
    StoreDevtoolsModule.instrument({
      // maxAge: 25, // Retains last 25 states
      // autoPause: true, // Pauses recording actions and state changes when the extension window is not open
      trace: true, // Enable tracing
      features: {
        
      }
    }),
    
  ],
  providers: [
    { 
      provide: FIRESTORE_SETTINGS, 
      useValue: { ignoreUndefinedProperties: true } 
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        subscriptSizing: 'dynamic'
      }
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SpinnerInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { 
  constructor(
    // TODO maybe should put it in core module
    translate: TranslateService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
  ) {
    translate.setDefaultLang('en');
    translate.use('en');

    const icons = ['sidenav-dashboard', 'sidenav-create', 'sidenav-spend', 'sidenav-logout', 'sidenav-close'];

    icons.forEach((icon: string) => {
      matIconRegistry.addSvgIcon(
        icon,
        domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/' + icon + '.svg'),
      );
    });
  }
}
