import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = new AuthService();
  const router = new Router();

  const userRole = localStorage.getItem('userRole');
  if (userRole === 'ROLE_ADMIN') {
    console.log('[ADMIN] AuthGuard ejecutado para:', state.url);
    console.log('[ADMIN] Usuario autenticado:', authService.isAuthenticated());
  }

  if(authService.isAuthenticated()){
    return true;
  }
  else{
    if (userRole === 'ROLE_ADMIN') {
      console.log('[ADMIN] Acceso denegado, redirigiendo a login');
    }
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
};
