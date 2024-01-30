import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateBudgetComponent } from './create-budget.component';

const routes: Routes = [
  {
    path: '',
    title: 'Create Budget',
    component: CreateBudgetComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CreateBudgetRoutingModule { }
