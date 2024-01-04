import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Firestore } from '@angular/fire/firestore';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(
    private translate: TranslateService,
  ) {}

  switchLanguage(language: string) {
    this.translate.use(language);
  }
}
