import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { SpinnerInterceptor } from '../core/interceptors/spinner.interceptor';

@NgModule({
  declarations: [],
  exports: [
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  imports: [
    CommonModule,
  ],
  providers: [
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: SpinnerInterceptor,
    //   multi: true,
    // },
  ]
})
export class SharedModule {}
