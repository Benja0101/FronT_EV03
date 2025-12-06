import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError, switchMap } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Permitir requests a endpoints de token sin autenticación
  if (req.url.includes('/token/')) {
    return next(req);
  }
  
  // Permitir requests públicas (sin token para clientes)
  const publicEndpoints = [
    '/productos/',
    '/venta/',
    '/detalleVenta/'
  ];
  
  // Permitir solo POST a /clientes/ sin token (crear cliente)
  if (req.method === 'POST' && req.url.includes('/clientes/')) {
    const token = localStorage.getItem('access_token');
    if (token) {
      const clonedRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next(clonedRequest);
    }
    return next(req);
  }
  
  // Permitir GET a productos sin token
  if (req.method === 'GET' && req.url.includes('/productos/')) {
    const token = localStorage.getItem('access_token');
    if (token) {
      const clonedRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next(clonedRequest);
    }
    return next(req);
  }
  
  // Permitir POST a ventas y detalles sin token
  if (req.method === 'POST' && (req.url.includes('/venta/') || req.url.includes('/detalleVenta/'))) {
    const token = localStorage.getItem('access_token');
    if (token) {
      const clonedRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next(clonedRequest);
    }
    return next(req);
  }
  
  const token = localStorage.getItem('access_token');
  
  // Si no hay token, dejar pasar la request sin Authorization header
  // El servidor responderá con 401/403 y el guard se encargará de la redirección
  if (!token) {
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      })
    );
  }
  
  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('❌ Error HTTP:', {
        url: error.url,
        status: error.status,
        message: error.message,
        error: error.error
      });
      
      // Si es error 401, intentar refrescar el token
      if (error.status === 401 && !req.url.includes('/token/refresh/')) {
        console.log('🔄 Token expirado, intentando refrescar...');
        
        return authService.refreshToken().pipe(
          switchMap((response) => {
            console.log('✅ Token refrescado exitosamente');
            // Reintentar la petición original con el nuevo token
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${response.access}`
              }
            });
            return next(newReq);
          }),
          catchError((refreshError) => {
            console.error('❌ Error al refrescar token:', refreshError);
            // Si falla el refresh, cerrar sesión y redirigir al login
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }
      
      // Si es error 403, solo reportar (no hacer logout automáticamente)
      if (error.status === 403) {
        console.error('❌ Error 403 Forbidden - El token no es válido o ha expirado');
      }
      
      return throwError(() => error);
    })
  );
};
