import { Component, Signal } from '@angular/core';
import { AuthService } from '../../core/services/auth-service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

  isAdmin: Signal<boolean>

  constructor(public authSer: AuthService){
   
    this.isAdmin = this.authSer.isAdmin
  }

  get userRole(){
    return this.authSer.getRoleFromStorage()
  }

  get user(){
    return this.authSer.getUserFromToken();
  }

}
