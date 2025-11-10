import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/auth';

  constructor(private http?: HttpClient, private router?: Router) {}

  login(username: string, password: string): Observable<any> {
    if (!this.http) {
      throw new Error('Http client no inicializado');
    }

    return this.http.post<any>(`${this.baseUrl}/login`, { username, password })
      .pipe(
        map(response => {
          if (response && response.token) {
            // Guardar token
            localStorage.setItem('token', response.token);

            // Decodificar el token JWT para extraer usuarioId
            const tokenData = this.decodificarToken(response.token);

            // Intentar obtener usuarioId de diferentes fuentes
            let usuarioId = response.usuarioId ||
                           response.userId ||
                           tokenData?.usuarioId ||
                           tokenData?.userId ||
                           tokenData?.id ||
                           tokenData?.sub;

            if (usuarioId) {
              // Si es string, convertir a número
              if (typeof usuarioId === 'string') {
                usuarioId = parseInt(usuarioId);
              }
              localStorage.setItem('usuarioId', usuarioId.toString());
            }

            // Guardar username si viene en la respuesta o en el token
            const usernameValue = response.username ||
                                 tokenData?.username ||
                                 tokenData?.email ||
                                 username;

            if (usernameValue) {
              localStorage.setItem('username', usernameValue);
            }

            // Guardar rol del usuario si viene en la respuesta o en el token
            // Spring Security devuelve roles como "ROLE_ADMIN" o "ROLE_USER"
            let userRole = response.role ||
                           response.rol ||
                           tokenData?.role ||
                           tokenData?.rol ||
                           tokenData?.authorities?.[0]?.authority ||
                           tokenData?.authorities?.[0] ||
                           'ROLE_USER'; // Por defecto ROLE_USER si no viene

            // Asegurarse de que el rol tenga el prefijo ROLE_
            if (!userRole.startsWith('ROLE_')) {
              userRole = 'ROLE_' + userRole.toUpperCase();
            }

            localStorage.setItem('userRole', userRole);

            // Solo mostrar logs si es ADMIN
            if (userRole === 'ROLE_ADMIN') {
              console.log('[ADMIN] Login exitoso');
              console.log('[ADMIN] Rol:', userRole);
              console.log('[ADMIN] Usuario ID:', usuarioId);
              console.log('[ADMIN] Username:', usernameValue);
            }

            return response;
          } else {
            throw new Error('No se recibió un token de acceso válido');
          }
        }),
        catchError(error => {
          console.error('Error en login:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Decodifica el payload de un token JWT
   */
  private decodificarToken(token: string): any {
    try {
      const partes = token.split('.');
      if (partes.length !== 3) {
        return null;
      }

      const payload = partes[1];
      const decodificado = atob(payload);
      const datos = JSON.parse(decodificado);

      return datos;
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtiene el usuarioId desde localStorage
   */
  getUsuarioId(): number | null {
    const usuarioIdStr = localStorage.getItem('usuarioId');
    if (!usuarioIdStr) return null;

    const usuarioId = parseInt(usuarioIdStr);
    return isNaN(usuarioId) ? null : usuarioId;
  }

  register(userData: { username: string; password: string; nombre: string; apellido: string }): Observable<any> {
    if (!this.http) {
      throw new Error('Http client no inicializado');
    }
    return this.http.post<any>(`${this.baseUrl}/registro`, userData)
      .pipe(
        catchError(this.handleError)
      );
  }

  logout() {
    const wasAdmin = this.isAdmin();
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');

    if (wasAdmin) {
      console.log('[ADMIN] Sesión cerrada');
    }

    this.router?.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  isAdmin(): boolean {
    const userRole = localStorage.getItem('userRole');
    return userRole === 'ROLE_ADMIN' || userRole === 'ADMIN' || userRole === 'admin';
  }

  getUserRole(): string | null {
    return localStorage.getItem('userRole');
  }

  handleError(error: any) {
    console.error('Error en la solicitud:', error);
    return throwError(() => error);
  }
}
