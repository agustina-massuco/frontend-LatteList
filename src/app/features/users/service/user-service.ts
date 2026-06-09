import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import User, { EstadoUsuario } from '../model/User';
import { environment } from '../../../../environments/environment';



@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly authUrl = `${environment.apiUrl}/auth`;
  private readonly userUrl = `${environment.apiUrl}/usuarios`;

  users = signal<User[]>([]);

  constructor(private http: HttpClient) { }

  private setUsers(users: User[]) {
    this.users.set(users);
  }

  

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.userUrl}/listado`).pipe(
      tap(users => this.setUsers(users)), 
      catchError(this.manejarError) 
    );
  }

  getUser(id: number | string): Observable<User> {
    return this.http.get<User>(`${this.userUrl}/${id}`)
      .pipe(catchError(this.manejarError));
  }

  postUser(u: User): Observable<any> {
    const dto = {
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        password: u.password,
        fotoPerfil: u.fotoPerfil
    };

    let request$: Observable<any>;

    if (u.tipoUser === 'admin') {
       request$ = this.http.post(`${this.userUrl}/crear-admin`, dto);
    } else {
       request$ = this.http.post(`${this.authUrl}/register`, dto);
    }

    return request$.pipe(
        tap(() => {
            if(u.tipoUser === 'admin') this.getAllUsers().subscribe(); 
        }),
        catchError(this.manejarError)
    );
  }

 /* contarAdminsActivos(): Observable<number> {
    return this.http.get<number>(`${this.userUrl}/count-admins`).pipe(
        catchError(this.manejarError)
    );
  }*/

  deleteUser(id: number | string): Observable<void> {
    return this.http.patch<void>(`${this.userUrl}/${id}/estado`, { estado: 'ELIMINADO' })
      .pipe(
        tap(() => {
          this.users.update(list => list.filter(user => user.id != id));
        }),
        catchError(this.manejarError)
      );
  }

  putUser(u: User): Observable<User> {
    return this.http.put<User>(`${this.userUrl}/me`, u)
      .pipe(
        tap(userActu => {
          this.users.update(list =>
            list.map(user => user.id === u.id ? userActu : user)
          );
        }),
        catchError(this.manejarError)
      );
  }

  cambiarEstadoUsuario(id: number | string, nuevoEstado: EstadoUsuario): Observable<void> {
      return this.http.patch<void>(`${this.userUrl}/${id}/estado`, { estado: nuevoEstado })
        .pipe(
            tap(() => {
                this.users.update(list => 
                    list.map(u => u.id == id ? { ...u, estado: nuevoEstado } : u)
                );
            }),
            catchError(this.manejarError)
        );
  }

  changePassword(actual: string, nueva: string): Observable<void> {
    return this.http.patch<void>(`${this.userUrl}/me/password`, { actual, nueva })
      .pipe(catchError(this.manejarError));
  }

  verificarEmailExistente(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.authUrl}/check-email?email=${email}`);
  }

  actualizarFotoPerfil(fotoBase64: string): Observable<any> {
      const dto = { fotoPerfil: fotoBase64 }; 
      return this.http.put(`${this.userUrl}/me`, dto).pipe(
          tap(() => {
             this.getAllUsers().subscribe();
          }),
          catchError(this.manejarError)
      );
  }

  
  manejarError(error: HttpErrorResponse) {
    
    if (error.error && error.error.message) {
        return throwError(() => error);
    }

    let mensaje = 'Ocurrió un error inesperado. Intente de nuevo.';
    
    if (error.status === 0) mensaje = 'Error de conexión con el servidor.';
    else if (error.status === 404) mensaje = 'Usuario no encontrado.';
    else if (error.status === 500) mensaje = 'Error interno del servidor.';
    else if (error.status === 403) mensaje = 'Acceso denegado.';
    
    console.error(`Error ${error.status}: ${error.message}`);
    
    return throwError(() => ({ 
        status: error.status,
        error: { message: mensaje } 
    }));
  }
}