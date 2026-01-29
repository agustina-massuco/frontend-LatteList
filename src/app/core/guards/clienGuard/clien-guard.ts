import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { inject } from '@angular/core';

export const clienGuard: CanActivateFn = (route, state) => {
 const authService = inject(AuthService);
  const router = inject(Router);

  const roleRaw = authService.getRoleFromStorage();
  const role = roleRaw ? roleRaw.toUpperCase() : null;
  
  console.log('DEBUG Guard - Rol detectado:', role); 
  
  if (role === 'CLIENTE') {
    return true; 
  }

  if (role && role !== 'CLIENTE') {
    console.warn('Acceso denegado: Rol incorrecto');
    router.navigate(['/home']); 
    return false;
  }
 
  return true;

};
