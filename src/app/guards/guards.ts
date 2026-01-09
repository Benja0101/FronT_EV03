import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard para proteger rutas de administrador
export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

// Guard para proteger rutas de cliente
export const clienteGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isCliente()) {
    return true;
  }

  router.navigate(['/login-cliente']);
  return false;
};

// Guard para permitir acceso solo si NO está autenticado
export const guestGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Si está autenticado, redirigir según el tipo de usuario
  if (authService.isAdmin()) {
    router.navigate(['/admin/dashboard']);
  } else if (authService.isCliente()) {
    router.navigate(['/cliente/home']);
  }
  
  return false;
};

// Guard genérico que acepta ambos tipos de autenticación (para rutas mixtas)
export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
