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
    console.log('🔵 Interceptor - Request a endpoint de token:', req.url);
    return next(req);
  }
  
  const token = localStorage.getItem('access_token');
  
  console.log('🔵 Interceptor - Request a:', req.url);
  console.log('🔑 Token presente:', !!token);
  
  // Si no hay token, dejar pasar la request sin Authorization header
  // El servidor responderá con 401/403 y el guard se encargará de la redirección
  if (!token) {
    console.warn('⚠️ No hay token disponible para la request');
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error en request sin token:', error.status);
        return throwError(() => error);
      })
    );
  }
  
  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
  console.log('✅ Request con Authorization header');
  
  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('❌ Error en request:', error);
      console.error('Status:', error.status);
      console.error('Message:', error.message);
      
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
