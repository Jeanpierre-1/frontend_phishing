import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Observable,tap} from 'rxjs';
import { Enlace} from '../models/enlace';
export interface EnlaceDTO {
  url: string;
  aplicacion?: string;
  mensaje?: string;
  usuarioId?: number;
}


@Injectable({
  providedIn: 'root'
})
export class EnlaceService {
   private apiUrl = 'http://localhost:8080/api/enlaces';

 constructor(private http: HttpClient) {}

  // Crear un nuevo enlace
crearEnlace(enlaceDTO: EnlaceDTO): Observable<Enlace> {
    console.log('Enviando enlace COMPLETO:');
    console.log('  - URL:', enlaceDTO.url);
    console.log('  - Aplicación:', enlaceDTO.aplicacion);
    console.log('  - Mensaje:', enlaceDTO.mensaje);
    console.log('  - UsuarioId:', enlaceDTO.usuarioId);
    console.log('  - UsuarioId type:', typeof enlaceDTO.usuarioId);
    console.log('  - Token disponible:', !!localStorage.getItem('token'));
    console.log('  - JSON completo:', JSON.stringify(enlaceDTO, null, 2));

    return this.http.post<Enlace>(this.apiUrl, enlaceDTO).pipe(
      tap({
        next: (response) => console.log('Respuesta del servidor:', response),
        error: (error) => {
          console.error('Error detallado:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error,
            url: error.url
          });
        }
      })
    );
  }

  // Obtener todos los enlaces del usuario autenticado
  obtenerEnlaces(): Observable<Enlace[]> {
    return this.http.get<Enlace[]>(this.apiUrl);
  }

  // Obtener un enlace por ID
  obtenerEnlacePorId(id: number): Observable<Enlace> {
    return this.http.get<Enlace>(`${this.apiUrl}/${id}`);
  }

  // Actualizar un enlace
  actualizarEnlace(id: number, enlaceDTO: EnlaceDTO): Observable<Enlace> {
    return this.http.put<Enlace>(`${this.apiUrl}/${id}`, enlaceDTO);
  }

  // Eliminar un enlace
  eliminarEnlace(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Obtener enlaces por usuario
  obtenerEnlacesPorUsuario(usuarioId: number): Observable<Enlace[]> {
    return this.http.get<Enlace[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }
}
