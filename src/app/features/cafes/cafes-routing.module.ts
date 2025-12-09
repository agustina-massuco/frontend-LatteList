import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CafeList } from './pages/cafe-list/cafe-list';
import { CafeDetail } from './pages/cafe-detail/cafe-detail';
import { Descubrir } from './pages/descubrir/descubrir';

const routes: Routes = [

     { path: '', component: CafeList },          
   {path:'descubrir', component: Descubrir},
  { path: ':id', component: CafeDetail }     
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})


export class CafesRoutingModule { }