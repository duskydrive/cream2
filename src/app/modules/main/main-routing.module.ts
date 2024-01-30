import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main.component';
import { checkAuthState } from 'src/app/core/guards/auth.guards';

const routes: Routes = [
  {
    path: '',
    title: '',
    component: MainComponent,
    children: [
      {
        path: 'budget',
        loadChildren: () => import('./budget/budget.module').then(m => m.BudgetModule),
        // TODO: do I need it if its already in main route?
        // canMatch: [checkAuthState],
      },
      {
        path: 'create',
        loadChildren: () => import('./create-budget/create-budget.module').then(m => m.CreateBudgetModule),
        // TODO: do I need it if its already in main route?
        // canMatch: [checkAuthState],
      },
      {
        path: 'profile',
        loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule),
        // TODO: do I need it if its already in main route?
        // canMatch: [checkAuthState],
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }
