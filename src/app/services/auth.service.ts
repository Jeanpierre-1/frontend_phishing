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
        tap(response => {
          console.log('Respuesta completa del login:', response);
        }),
        map(response => {
          if (response && response.token) {
            // Guardar token
            localStorage.setItem('token', response.token);
            console.log('Token guardado');

            // Decodificar el token JWT para extraer usuarioId
            const tokenData = this.decodificarToken(response.token);
            console.log('Datos decodificados del token:', tokenData);

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
              console.log('UsuarioId guardado:', usuarioId);
            } else {
              console.warn('No se pudo obtener usuarioId del token ni de la respuesta');
            }

            // Guardar username si viene en la respuesta o en el token
            const usernameValue = response.username ||
                                 tokenData?.username ||
                                 tokenData?.email ||
                                 username;

            if (usernameValue) {
              localStorage.setItem('username', usernameValue);
              console.log('Username guardado:', usernameValue);
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
        console.error('Token JWT inválido (no tiene 3 partes)');
        return null;
      }

      const payload = partes[1];
      const decodificado = atob(payload);
      const datos = JSON.parse(decodificado);

      return datos;
    } catch (error) {
      console.error('Error al decodificar token:', error);
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
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('username');
    console.log('Sesión cerrada');
    this.router?.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  handleError(error: any) {
    console.error('Error en la solicitud:', error);
    return throwError(() => error);
  }
}
