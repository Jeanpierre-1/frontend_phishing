import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = new AuthService();
  const token = authService.getToken();

     // Endpoints que NO requieren autenticación
  const publicEndpoints = [
    '/auth/login',
    '/auth/registro',

  ];
  const isPublicEndpoint = publicEndpoints.some(endpoint =>
    req.url.includes(endpoint)
  );
    // Si es endpoint público y no hay token, enviar sin Authorization
  if (isPublicEndpoint ) {
    // Solo mostrar logs si es ADMIN
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'ROLE_ADMIN') {
      console.log('[ADMIN] Petición pública sin token:', req.url);
    }
    return next(req);
  }

  if(token){
    // Solo mostrar logs si es ADMIN
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'ROLE_ADMIN') {
      console.log('[ADMIN] Agregando token a la petición:', req.url);
    }
    req = req.clone({
      setHeaders: {
        Authorization:`Bearer ${token}`
      }
    })
  }
  return next(req);
};
