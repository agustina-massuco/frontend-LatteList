
import { computed, effect, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import LoginResponseJava from '../model/LoginResponseJava';
import User from '../../features/users/model/User';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = 'http://localhost:8080/auth';

  private loggedIn = signal<boolean>(this.hasToken());
  private userRole = signal<string>(this.getRoleFromStorage());

  isLoggedIn = computed(() => this.loggedIn());
  isAdmin = computed(() => this.userRole().toLowerCase() === 'admin');

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    effect(() => {
      console.log("Usuario logueado:", this.loggedIn(), "role:", this.userRole());
    });
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('auth_token');
  }


  getUserFromToken(): User | null {
    const token = localStorage.getItem('auth_token'); 
    if (!token) return null;

    try {
      const userWithoutPhoto: User = JSON.parse(atob(token));
      const photo = sessionStorage.getItem(`user_photo_${userWithoutPhoto.id}`); 

      if (photo) {
        userWithoutPhoto.fotoPerfil = photo;
      }
      return userWithoutPhoto;

    } catch(e) { 
        console.error("Error al parsear token:", e); 
        return null;
    }
  }


  getToken(): string | null {
  return localStorage.getItem('jwt_token');
}




  getRoleFromStorage(): string {
    const user = this.getUserFromToken();
    return user?.tipoUser?.toLowerCase() || '';
  }




  login(email: string, password: string): Observable<User> {
    
    return this.http.post<LoginResponseJava>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        map(response => {
           
           localStorage.setItem('jwt_token', response.token);

           const userAdaptado: User = {
             id: response.id,
             nombre: response.nombre,
             apellido: response.apellido,
             email: response.email,
             password: '', 
             tipoUser: response.tipoDeUsuario,
             fotoPerfil: response.fotoPerfil,
             estado: response.estado
           };

           this.saveAuthData(userAdaptado);
           
           return userAdaptado;
        }),
        catchError(error => {
           console.error('Error login back:', error);
           return throwError(() => error); 
        })
      );
  }



  private saveAuthData(user: User): void {
    const userForToken = { ...user };

    if (userForToken.id) {
        sessionStorage.removeItem(`user_photo_${userForToken.id}`);
    }
    
    if (userForToken.fotoPerfil && userForToken.fotoPerfil.length > 250) {
        console.warn('Foto de perfil Base64 detectada. Moviendo a sessionStorage.');
        if (userForToken.id) {
            sessionStorage.setItem(`user_photo_${userForToken.id}`, userForToken.fotoPerfil);
        }
        delete userForToken.fotoPerfil; 
    }
    
    const token = btoa(JSON.stringify(userForToken)); 
    localStorage.setItem('auth_token', token); 

    this.loggedIn.set(true);
    this.userRole.set(user.tipoUser?.toLowerCase() || '');
  }



  actualizarToken(user: User): void {
    this.saveAuthData(user);
    console.log("Token actualizado en AuthService");
  }


  sesionActiva(): boolean {
   const token = localStorage.getItem('jwt_token'); 

    if (!token) {
      console.log('No hay token JWT en localStorage');
      return false; 
    }

    if (this.isTokenExpired(token)) {
      console.log('El token JWT ha expirado');
      this.logout(); 
      return false;
    }

    return true; 
  }

  private isTokenExpired(token: string): boolean {
    try {
      const tokenLimpio = token.replace('Bearer ', '');

      const partes = tokenLimpio.split('.');
      
      if (partes.length !== 3) {
        throw new Error('Token mal formado');
      }

      const payloadBase64 = partes[1];
      const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = atob(base64);
      
      const payload = JSON.parse(payloadJson);
     
      const expiracion = payload.exp;
      const ahora = Math.floor(Date.now() / 1000);

      return expiracion < ahora;
      
    } catch (e) {
      console.error('Error verificando expiración:', e);
      return true;
    }
  }

  logout(): void {
    const user = this.getUserFromToken(); 
    
    localStorage.removeItem('auth_token');     
    localStorage.removeItem('jwt_token');      

    if (user && user.id) {
        sessionStorage.removeItem(`user_photo_${user.id}`); 
    }
    this.loggedIn.set(false);
    this.userRole.set('');
    this.router.navigate(['/auth/login']);
  }



 forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forgot-password?email=${email}`, {});
  }



  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, { token, newPassword });
  }

}
