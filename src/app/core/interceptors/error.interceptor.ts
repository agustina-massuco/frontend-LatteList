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
        
        const msg = typeof error.error === 'string' ? error.error : error.error?.message;
        
        if (msg && (msg.toLowerCase().includes('suspendida') || 
                    msg.toLowerCase().includes('bloqueada') || 
                    msg.toLowerCase().includes('eliminada'))) {
            
            if (!req.url.includes('/auth/login')) {
                console.warn('Suspensión de cuenta detectada. Cerrando sesión...');
                authService.logout(); 
                router.navigate(['/auth/login']);
            }
        }
   
      }

      return throwError(() => error);
    })
  );
};