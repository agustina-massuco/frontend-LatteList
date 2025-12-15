import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import ReviewResponse from '../model/Review'; 
import ReviewRequest from '../model/ReviewRequest';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private baseUrl = 'http://localhost:8080/reviews';

  constructor(private http: HttpClient) {}

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


  reaccionar(reviewId: number, userId: number, tipo: string): Observable<void> { 
    return this.http.post<void>(
      `${this.baseUrl}/${reviewId}/reaccion/${userId}?tipo=${tipo}`, 
      {}
    ).pipe(catchError(this.manejarError));
  }

  quitarReaccion(reviewId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${reviewId}/reaccion/${userId}`)
    .pipe(catchError(this.manejarError));
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

/*import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import ReviewResponse from '../model/Review';
import ReviewRequest from '../model/ReviewRequest';
import { TipoReaccion } from '../model/LikeReview';
import { AuthService } from '../../../core/services/auth-service';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
private baseUrl = 'http://localhost:8080/reviews';

  constructor(
    private http: HttpClient,
    private authService: AuthService 
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken(); 
    
    if (!token) {
        console.warn("ADVERTENCIA: Solicitud protegida sin token JWT.");
        return new HttpHeaders(); 
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }


  crearReview(request: ReviewRequest): Observable<ReviewResponse> {
    const headers = this.getAuthHeaders();
    
    if (!headers.has('Authorization')) {
        return throwError(() => new Error('Se requiere autenticación para crear una reseña.'));
    }
    
    return this.http.post<ReviewResponse>(
        `${this.baseUrl}`, 
        request,
        { headers: headers } 
    );
  }


  editarReview(reviewId: number, request: ReviewRequest): Observable<ReviewResponse> {
    const headers = this.getAuthHeaders();

    if (!headers.has('Authorization')) {
        return throwError(() => new Error('Se requiere autenticación para editar una reseña.'));
    }

    return this.http.put<ReviewResponse>(
        `${this.baseUrl}/${reviewId}`, 
        request,
        { headers: headers } 
    );
  }

  eliminar(reviewId: number): Observable<void> {
    const headers = this.getAuthHeaders();
    if (!headers.has('Authorization')) {
        return throwError(() => new Error('Se requiere autenticación para eliminar.'));
    }
    
    return this.http.delete<void>(
        `${this.baseUrl}/${reviewId}`,
        { headers: headers }
    );
  }

  desactivar(reviewId: number): Observable<void> {
    const headers = this.getAuthHeaders();
    if (!headers.has('Authorization')) {
        return throwError(() => new Error('Se requiere autenticación para desactivar.'));
    }

    return this.http.patch<void>(
        `${this.baseUrl}/${reviewId}/desactivar`, 
        {},
        { headers: headers }
    );
  }

  activar(reviewId: number): Observable<void> {
    const headers = this.getAuthHeaders();
    if (!headers.has('Authorization')) {
        return throwError(() => new Error('Se requiere autenticación para activar.'));
    }

    return this.http.patch<void>(
        `${this.baseUrl}/${reviewId}/activar`, 
        {},
        { headers: headers }
    );
  }

  getByCafe(cafeId: number, incluirInactivas = false): Observable<ReviewResponse[]> {
    const headers = this.getAuthHeaders();

    if (!headers.has('Authorization')) {
        return throwError(() => new Error('Se requiere autenticación para ver las reseñas con detalles de usuario.'));
    }

    return this.http.get<ReviewResponse[]>(
      `${this.baseUrl}/cafe/${cafeId}?incluirInactivas=${incluirInactivas}`,

      { headers: headers }
    );
  }

  getByUsuario(userId: number, incluirInactivas = false): Observable<ReviewResponse[]> {
    const headers = this.getAuthHeaders();
    if (!headers.has('Authorization')) {
        return throwError(() => new Error('Se requiere autenticación para ver las reseñas del usuario.'));
    }

    return this.http.get<ReviewResponse[]>(
      `${this.baseUrl}/usuario/${userId}?incluirInactivas=${incluirInactivas}`,
      { headers: headers }
    );
  }

  reaccionar(reviewId: number, userId: number, tipo: TipoReaccion): Observable<void> {
    const headers = this.getAuthHeaders();
    if (!headers.has('Authorization')) {
        return throwError(() => new Error('Se requiere autenticación para reaccionar.'));
    }

    return this.http.post<void>(
      `${this.baseUrl}/${reviewId}/reaccion/${userId}?tipo=${tipo}`, 
      {}, 
      { headers: headers }
    );
  }

  quitarReaccion(reviewId: number, userId: number): Observable<void> {
    const headers = this.getAuthHeaders();
    if (!headers.has('Authorization')) {
        return throwError(() => new Error('Se requiere autenticación para quitar reacción.'));
    }

    return this.http.delete<void>(
      `${this.baseUrl}/${reviewId}/reaccion/${userId}`,
      { headers: headers }
    );
  }

/*
reaccionar(reviewId: number, userId: number, tipo: TipoReaccion): Observable<ReviewResponse> {
  const headers = this.getAuthHeaders();
  return this.http.post<ReviewResponse>(
    `${this.baseUrl}/${reviewId}/reaccion/${userId}?tipo=${tipo}`,
    {},
    { headers }
  );
}

quitarReaccion(reviewId: number, userId: number): Observable<ReviewResponse> {
  const headers = this.getAuthHeaders();
  return this.http.delete<ReviewResponse>(
    `${this.baseUrl}/${reviewId}/reaccion/${userId}`,
    { headers }
  );
}*/

