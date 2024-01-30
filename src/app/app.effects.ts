import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { BudgetEffects } from './store/budget/budget.effects';
import { UserEffects } from './store/user/user.effects';

@NgModule({
  imports: [
    EffectsModule.forRoot([BudgetEffects, UserEffects]),
  ],
})
export class AppEffectsModule {}