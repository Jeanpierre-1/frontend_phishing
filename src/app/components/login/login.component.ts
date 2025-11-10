import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Si ya está autenticado, redirigir a home
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit(): void {
    // Validaciones
    if (!this.username.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Usuario requerido',
        text: 'Por favor ingrese su nombre de usuario',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    if (!this.password.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseña requerida',
        text: 'Por favor ingrese su contraseña',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    this.login();
  }

 private login(): void {
  this.isLoading = true;

  // CORREGIR: Pasar username y password como parámetros separados
  this.authService.login(this.username.trim(), this.password.trim()).subscribe({
    next: (response) => {
      // Solo mostrar logs si es ADMIN
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'ROLE_ADMIN') {
        console.log('[ADMIN] Login exitoso desde componente');
      }

      Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: `Hola ${this.username}`,
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        this.router.navigate(['/home']);
      });

      this.isLoading = false;
    },
    error: (error) => {
      // Los errores siempre se muestran para facilitar soporte
      console.error('Error en login:', error);
      this.isLoading = false;
      this.handleLoginError(error);
    }
  });
}

  private handleLoginError(error: any): void {
    let errorMessage = 'Error al iniciar sesión';

    if (error.status === 401 || error.status === 403) {
      errorMessage = 'Usuario o contraseña incorrectos';
    } else if (error.status === 0) {
      errorMessage = 'No se pudo conectar con el servidor. Verifique que esté corriendo en http://localhost:8080';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    Swal.fire({
      icon: 'error',
      title: 'Error de Autenticación',
      text: errorMessage,
      confirmButtonColor: '#2563eb'
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}
