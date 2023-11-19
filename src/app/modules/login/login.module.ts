import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared/shared.module';

import { LoginComponent } from './login.component';
import { LoginRoutingModule } from './login-routing.module';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
  declarations: [
    LoginComponent,
  ],
  imports: [
    SharedModule,
    LoginRoutingModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ]
})
export class LoginModule { }
