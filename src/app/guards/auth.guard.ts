import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    console.log('✅ Guard: Usuario autenticado');
    return true;
  }

  console.log('❌ Guard: Usuario no autenticado, redirigiendo a login');
  router.navigate(['/login']);
  return false;
};
