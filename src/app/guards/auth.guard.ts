import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = new AuthService();
  const router = new Router();

console.log('AuthGuard ejecutado para:', state.url);
  console.log('Usuario autenticado:', authService.isAuthenticated());


  if(authService.isAuthenticated()){
    return true;
  }
  else{
    console.log('❌ Acceso denegado, redirigiendo a login');
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
  }


};
