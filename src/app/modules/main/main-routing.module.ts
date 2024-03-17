import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main.component';

const routes: Routes = [
  {
    path: '',
    title: '',
    component: MainComponent,
    children: [
      {
        path: 'budget',
        loadChildren: () => import('./budget/budget.module').then(m => m.BudgetModule),
      },
      {
        path: 'create',
        loadChildren: () => import('./create-budget/create-budget.module').then(m => m.CreateBudgetModule),
      },
      {
        path: 'profile',
        loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule),
      },
      {
        path: 'spend',
        loadChildren: () => import('./spend/spend.module').then(m => m.SpendModule),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'budget',
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }
