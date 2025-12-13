import { RouterModule, Routes } from "@angular/router";
import { UserList } from "./pages/user-list/user-list";
import { UserDetails } from "./pages/user-details/user-details";
import { UserRegistro } from "./pages/user-registro/user-registro";
import { NgModule } from "@angular/core";
import { ChangePassword } from "./pages/change-password/change-password";
import { authGuard } from "../../core/guards/authGuard/auth-guard";
import { adminGuard } from "../../core/guards/adminGuard/admin-guard";


const routes: Routes = [
  { path: 'perfil', component: UserDetails, canActivate: [authGuard] }, 
  { path: 'perfil/editar', component: UserRegistro, canActivate: [authGuard] }, 
  { path: 'cambiar-password', component: ChangePassword, canActivate: [authGuard]},

  { path: 'listado', component: UserList, canActivate: [authGuard, adminGuard]},  
  { path: 'registrarAdmin', component: UserRegistro, canActivate: [authGuard, adminGuard] }, 
  { path: 'perfil/:id', component: UserDetails, canActivate: [authGuard, adminGuard] }, 
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class UserRoutingModule { }