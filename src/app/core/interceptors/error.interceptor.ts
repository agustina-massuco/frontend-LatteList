import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth-service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      
      if (error.status === 403) {
        
        if (!req.url.includes('/auth/login')) {
            console.warn('Acceso prohibido detectado (403). Cerrando sesión...');
            
            authService.logout(); 
            
            router.navigate(['/auth/login']);
        }
      }

      return throwError(() => error);
    })
  );
};