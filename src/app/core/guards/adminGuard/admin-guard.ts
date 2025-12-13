import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = (route, state) => {
 const authService = inject(AuthService);
  const router = inject(Router);

 const role = authService.getRoleFromStorage()?.toUpperCase(); 
  
  if (role === 'ADMIN') {
    return true; 
  }

  router.navigate(['/usuarios/perfil']);
  return false;
};
