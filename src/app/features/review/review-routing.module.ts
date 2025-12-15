import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReviewForm } from './pages/review-form/review-form';

const routes: Routes = [
 //{ path: '', component: ReviewList }, 
  //{ path: 'crear', component: ReviewForm },   
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})


export class ReviewRoutingModule { }