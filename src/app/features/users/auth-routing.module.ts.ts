import { RouterModule, Routes } from "@angular/router";
import { UserList } from "./pages/user-list/user-list";
import { UserDetails } from "./pages/user-details/user-details";
import { UserLogin } from "./pages/user-login/user-login";
import { UserRegistro } from "./pages/user-registro/user-registro";
import { NgModule } from "@angular/core";
import { ResetPassword } from "./pages/reset-password/reset-password";
import { ForgotPassword } from "./pages/forgot-password/forgot-password";



const routes: Routes = [
  { path: 'login', component: UserLogin },         
  { path: 'registrarse', component: UserRegistro },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'reset-password', component: ResetPassword },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class AuthRoutingModule { }