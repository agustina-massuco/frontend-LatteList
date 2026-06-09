import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import ReviewResponse from '../model/Review'; 
import ReviewRequest from '../model/ReviewRequest';
import { AuthService } from '../../../core/services/auth-service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private baseUrl = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient,
    private auth:AuthService
  ) {}

  crearReview(request: ReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(this.baseUrl, request)
    .pipe(catchError(this.manejarError));
  }

  editarReview(reviewId: number, request: ReviewRequest): Observable<ReviewResponse> {
    return this.http.put<ReviewResponse>(`${this.baseUrl}/${reviewId}`, request)
    .pipe(catchError(this.manejarError));
  }

  
  eliminar(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${reviewId}`)
    .pipe(catchError(this.manejarError));
  }

  desactivar(reviewId: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${reviewId}/desactivar`, {})
    .pipe(catchError(this.manejarError));
  }

  activar(reviewId: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${reviewId}/activar`, {})
    .pipe(catchError(this.manejarError));
  }

 /* getByCafe(cafeId: number, incluirInactivas = false): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(
      `${this.baseUrl}/cafe/${cafeId}?incluirInactivas=${incluirInactivas}`
    ).pipe(catchError(this.manejarError));
  }*/

    
 getByCafe(cafeId: number, incluirInactivas = false): Observable<ReviewResponse[]> {
  return this.http.get<ReviewResponse[]>(
    `${this.baseUrl}/cafe/${cafeId}?incluirInactivas=${incluirInactivas}`
  ).pipe(catchError(this.manejarError));
}


  getByUsuario(userId: number, incluirInactivas = false): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(
      `${this.baseUrl}/usuario/${userId}?incluirInactivas=${incluirInactivas}`
    ).pipe(catchError(this.manejarError));
  }


 /* reaccionar(reviewId: number, userId: number, tipo: string): Observable<void> { 
    return this.http.post<void>(
      `${this.baseUrl}/${reviewId}/reaccion/${userId}?tipo=${tipo}`, 
      {}
    ).pipe(catchError(this.manejarError));
  }*/

  reaccionar(reviewId: number, tipo: 'LIKE' | 'DISLIKE'): Observable<any> {
  const token = this.auth.getToken(); 
  return this.http.post(
    `${this.baseUrl}/${reviewId}/reaccion`, 
    null,
    {
      params: { tipo }, 
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}


quitarReaccion(reviewId: number): Observable<void> {
  const token = this.auth.getToken();
  return this.http.delete<void>(
    `${this.baseUrl}/${reviewId}/reaccion`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  ).pipe(catchError(this.manejarError));
}


  cambiarEstado(reviewId: number, nuevoEstado: 'ACTIVA' | 'INACTIVA' | 'ELIMINADA'): Observable<void> {
    if (nuevoEstado === 'ACTIVA') {
        return this.activar(reviewId);
    } else if (nuevoEstado === 'INACTIVA') {
        return this.desactivar(reviewId);
    } else {
        return this.eliminar(reviewId);
    }
  }

  manejarError(error: HttpErrorResponse) {
    let mensaje = 'Ocurrió un error inesperado. Intente de nuevo.';
    if (error.status === 0) mensaje = 'Error de conexión con el servidor.';
    else if (error.status === 404) mensaje = 'Usuario no encontrado.';
    else if (error.status === 500) mensaje = 'Error interno del servidor.';
    else if (error.status === 403) mensaje = 'Acceso denegado.';
    
    console.error(`Error ${error.status}: ${error.message}`);
    return throwError(() => new Error(mensaje));
  }
}

