import { RouterModule, Routes } from "@angular/router";
import { ListOfList } from "./pages/list-of-list/list-of-list";
import { ListDetails } from "./pages/list-details/list-details";
import { NgModule } from "@angular/core";



const routes: Routes = [
  { path: '', component: ListOfList }, 
  { path: ":id", component: ListDetails }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class ListRoutingModule { }