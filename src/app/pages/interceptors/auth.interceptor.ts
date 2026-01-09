import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError, switchMap } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Permitir requests a endpoints de autenticación sin token
  if (req.url.includes('/token/') || req.url.includes('/login/') || req.url.includes('/register/')) {
    return next(req);
  }
  
  // Determinar qué tipo de token usar
  const adminToken = localStorage.getItem('access_token');
  const clienteToken = localStorage.getItem('cliente_token');
  
  // Endpoints que requieren token de cliente
  const clienteEndpoints = [
    '/clientes/perfil',
    '/clientes/cambiar-password'
  ];
  
  // Endpoints públicos que no requieren token
  const publicEndpoints = [
    '/productos/',
    '/venta/',
    '/detalleVenta/'
  ];
  
  // Permitir POST/GET a productos sin token (pero agregarlo si existe)
  if (req.url.includes('/productos/')) {
    if (adminToken) {
      const clonedRequest = req.clone({
        setHeaders: { Authorization: `Bearer ${adminToken}` }
      });
      return next(clonedRequest);
    }
    return next(req);
  }
  
  // Permitir POST a clientes/register sin token
  if (req.method === 'POST' && req.url.includes('/clientes/register')) {
    return next(req);
  }
  
  // Permitir POST a ventas sin token (pero agregarlo si existe)
  if (req.method === 'POST' && (req.url.includes('/venta/') || req.url.includes('/detalleVenta/'))) {
    if (adminToken) {
      const clonedRequest = req.clone({
        setHeaders: { Authorization: `Bearer ${adminToken}` }
      });
      return next(clonedRequest);
    }
    return next(req);
  }
  
  // Usar token de cliente para endpoints específicos de cliente
  const isClienteEndpoint = clienteEndpoints.some(endpoint => req.url.includes(endpoint));
  if (isClienteEndpoint && clienteToken) {
    const clonedRequest = req.clone({
      setHeaders: { Authorization: `Token ${clienteToken}` }
    });
    return handleRequest(clonedRequest, next, authService, router, false);
  }
  
  // Usar token de admin para todo lo demás
  if (adminToken) {
    const clonedRequest = req.clone({
      setHeaders: { Authorization: `Bearer ${adminToken}` }
    });
    return handleRequest(clonedRequest, next, authService, router, true);
  }
  
  // Si no hay token, dejar pasar sin Authorization
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      return throwError(() => error);
    })
  );
};

function handleRequest(req: any, next: any, authService: AuthService, router: Router, isAdmin: boolean) {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('❌ Error HTTP:', {
        url: error.url,
        status: error.status,
        message: error.message,
        error: error.error
      });
      
      // Si es error 401 y es admin, intentar refrescar el token
      if (error.status === 401 && isAdmin && !req.url.includes('/token/refresh/')) {
        console.log('🔄 Token expirado, intentando refrescar...');
        
        return authService.refreshToken().pipe(
          switchMap((response) => {
            console.log('✅ Token refrescado exitosamente');
            const newReq = req.clone({
              setHeaders: { Authorization: `Bearer ${response.access}` }
            });
            return next(newReq);
          }),
          catchError((refreshError) => {
            console.error('❌ Error al refrescar token:', refreshError);
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }
      
      // Si es error 401 y es cliente, redirigir al login de cliente
      if (error.status === 401 && !isAdmin) {
        console.log('⚠️ Cliente no autenticado');
        authService.logout();
        router.navigate(['/login-cliente']);
      }
      
      return throwError(() => error);
    })
  );
}
