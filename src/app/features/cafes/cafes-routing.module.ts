import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Descubrir } from './pages/descubrir/descubrir';
import { Mapa } from './pages/mapa/mapa';
import { CafeListComponent } from './pages/cafe-list/cafe-list';
import { CafeDetailComponent } from './pages/cafe-detail/cafe-detail';

const routes: Routes = [

  { path: '', component: CafeListComponent },          
  {path:'descubrir', component: Descubrir},
  {path: 'map', component: Mapa}  ,
  { path: ':id', component: CafeDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})


export class CafesRoutingModule { }