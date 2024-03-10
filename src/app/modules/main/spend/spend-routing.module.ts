import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SpendComponent } from './spend.component';

const routes: Routes = [
  {
    path: '',
    title: 'Spend',
    component: SpendComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SpendRoutingModule { }
