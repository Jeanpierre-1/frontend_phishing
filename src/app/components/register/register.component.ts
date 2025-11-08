import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule,RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit{


  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  nombre: string = '';
  apellido: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar si ya está autenticado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }
    // Validar formato de email
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSubmit(): void {
    // Validar que todos los campos estén llenos
    if (!this.username || !this.password || !this.nombre || !this.apellido || !this.confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, complete todos los campos',
        confirmButtonColor: '#6366f1'
      });
      return;
    }

    // Validar formato de email
    if (!this.isValidEmail(this.username)) {
      Swal.fire({
        icon: 'warning',
        title: 'Correo inválido',
        text: 'Por favor, ingrese un correo electrónico válido (ejemplo: usuario@dominio.com)',
        confirmButtonColor: '#6366f1'
      });
      return;
    }

    // Validar que las contraseñas coincidan
    if (this.password !== this.confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseñas no coinciden',
        text: 'Las contraseñas deben ser iguales',
        confirmButtonColor: '#6366f1'
      });
      return;
    }

    // Validar longitud mínima de contraseña
    if (this.password.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseña inválida',
        text: 'La contraseña debe tener al menos 6 caracteres',
        confirmButtonColor: '#6366f1'
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const userData = {
      username: this.username.trim().toLowerCase(),
      password: this.password,
      nombre: this.nombre.trim(),
      apellido: this.apellido.trim()
    };

    this.authService.register(userData).subscribe({
      next: (response) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'success',
          title: '¡Registro exitoso!',
          text: 'Tu cuenta ha sido creada correctamente',
          confirmButtonColor: '#6366f1'
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error en el registro', error);

        let errorMsg = 'Error al registrar usuario. Por favor, intente nuevamente.';

        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.status === 409) {
          errorMsg = 'El correo electrónico ya está en uso';
        } else if (error.status === 0) {
          errorMsg = 'No se pudo conectar con el servidor';
        }

        this.errorMessage = errorMsg;

        Swal.fire({
          icon: 'error',
          title: 'Error en el registro',
          text: errorMsg,
          confirmButtonColor: '#6366f1'
        });
      }
    });
  }

  clearForm(): void {
    this.username = '';
    this.password = '';
    this.confirmPassword = '';
    this.nombre = '';
    this.apellido = '';
    this.errorMessage = '';
  }
}
