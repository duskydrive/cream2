import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  declarations: [],
  exports: [
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  imports: [
    CommonModule,
  ]
})
export class SharedModule {}
