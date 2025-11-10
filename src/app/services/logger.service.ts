import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  constructor() { }

  /**
   * Verifica si el usuario actual es administrador
   */
  private isAdmin(): boolean {
    const userRole = localStorage.getItem('userRole');
    return userRole === 'ROLE_ADMIN' || userRole === 'ADMIN' || userRole === 'admin';
  }

  /**
   * Log normal - solo visible para administradores
   */
  log(message: string, ...args: any[]): void {
    if (this.isAdmin()) {
      console.log(`[LOG] ${message}`, ...args);
    }
  }

  /**
   * Log de información - solo visible para administradores
   */
  info(message: string, ...args: any[]): void {
    if (this.isAdmin()) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log de advertencia - solo visible para administradores
   */
  warn(message: string, ...args: any[]): void {
    if (this.isAdmin()) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Log de error - visible para todos (importante para debugging)
   */
  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }

  /**
   * Log de debug - solo visible para administradores en desarrollo
   */
  debug(message: string, ...args: any[]): void {
    if (this.isAdmin()) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log de datos sensibles - solo para admin y con prefijo de seguridad
   */
  secure(message: string, ...args: any[]): void {
    if (this.isAdmin()) {
      console.log(`[SECURE] ${message}`, ...args);
    }
  }
}
