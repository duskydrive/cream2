import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { RegisterComponent } from './register.component';
import { RegisterRoutingModule } from './register-routing.module';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [
    RegisterComponent,
  ],
  imports: [
    SharedModule,
    RegisterRoutingModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ]
})
export class RegisterModule { }
