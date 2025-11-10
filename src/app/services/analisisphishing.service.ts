import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnalisisPhishing {
  id?: number;
  enlaceId?: number;
  enlaceUrl?: string;
  urlEnlace?: string; // ✅ Campo del backend
  resultado: string;
  confianza: number;
  detalles?: string;
  fecha?: Date;
  usuarioId?: number;
  isPhishing?: boolean;
  probabilityPhishing?: number;
  message?: string;
  confidence?: string;
  label?: number;
  recommendation?: string;
  urlLength?: number; // ✅ Nombre correcto del backend
  urllength?: number; // ⚠️ Deprecado, usar urlLength
  domain?: string;
  domainLength?: number;
  pathLength?: number;
  protocol?: string;
  hasHttps?: boolean;
  hasQuery?: boolean;
  specialCharactersCount?: number;
  digitsInUrl?: number;
  digitsInDomain?: number;
  hasRepeatedDigits?: boolean;
  numberOfSubdomains?: number;
  dotsInDomain?: number;
  hyphensInDomain?: number;
  suspiciousKeywordsCount?: number;
  suspiciousKeywords?: string;
  analysisTimestamp?: string;
  apiResponseTime?: number;
  analysisVersion?: string;
}

export interface AnalisisPhishingDTO {
  enlaceId: number;
  resultado: string;
  confianza: number;
  detalles?: string;
}

export interface PhishingDetectionResponse {
isPhishing: boolean;
  probabilityPhishing: number;
  message?: string;
  confidence?: string;
  enlaceId?: number | null;
  url?: string;
}

export interface PhishingAnalysisRequest {
  url: string;
}

export interface Estadisticas {
  urlsAnalizadasEstaSemana: number;
  porcentajeCambioSemana: number;
  totalAnalisis: number;
  porcentajeCambioMes: number;
  usuariosRegistrados: number;
  distribucionGlobal: {
    totalPhishing: number;
    totalLegitimas: number;
    porcentajePhishing: number;
    porcentajeLegitimas: number;
  };
  topAplicacionesPhishing: Array<{
    aplicacion: string;
    cantidad: number;
    porcentaje: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AnalisisphishingService {
  private apiUrl = 'http://localhost:8080/api';
  constructor(private http: HttpClient) {}


  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  analizarUrl(url: string, enlaceId: number): Observable<PhishingDetectionResponse> {
    const request: PhishingAnalysisRequest = { url };

   const headers = this.getAuthHeaders();
    console.log('Analizando URL:', request);
    console.log('Endpoint:', `${this.apiUrl}/phishing/analyze`);

    return this.http.post<PhishingDetectionResponse>(
      `${this.apiUrl}/phishing/analyze`,
      request,
      { headers }
    );
  }

  /**
   * Obtiene todos los análisis del usuario autenticado
   * El backend filtra automáticamente usando @AuthenticationPrincipal
   */
  obtenerAnalisis(): Observable<AnalisisPhishing[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<AnalisisPhishing[]>(`${this.apiUrl}/analisis`, { headers } );
  }

  obtenerAnalisisPorId(id: number): Observable<AnalisisPhishing> {
    const headers = this.getAuthHeaders();
    return this.http.get<AnalisisPhishing>(`${this.apiUrl}/analisis/${id}`,  { headers });
  }

  crearAnalisis(analisisDTO: AnalisisPhishingDTO): Observable<AnalisisPhishing> {
    const headers = this.getAuthHeaders();
    console.log('📤 Creando análisis:', analisisDTO);
    console.log('📍 Endpoint:', `${this.apiUrl}/analisis`);

    return this.http.post<AnalisisPhishing>(
      `${this.apiUrl}/analisis`,
      analisisDTO,
      { headers }
    );
  }

  actualizarAnalisis(id: number, analisisDTO: AnalisisPhishingDTO): Observable<AnalisisPhishing> {
    const headers = this.getAuthHeaders();
    return this.http.put<AnalisisPhishing>(
      `${this.apiUrl}/analisis/${id}`,
      analisisDTO,
      { headers }
    );
  }

  eliminarAnalisis(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/analisis/${id}`,  { headers });
  }

  obtenerAnalisisPorEnlace(enlaceId: number): Observable<AnalisisPhishing[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<AnalisisPhishing[]>(
      `${this.apiUrl}/analisis/enlace/${enlaceId}`,
        { headers }
    );
  }

  obtenerAnalisisPorUsuario(usuarioId: number): Observable<AnalisisPhishing[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<AnalisisPhishing[]>(
      `${this.apiUrl}/analisis/usuario/${usuarioId}`, { headers }
    );
  }

  /**
   * Obtiene las estadísticas generales del sistema
   */
  obtenerEstadisticas(): Observable<Estadisticas> {
    const headers = this.getAuthHeaders();
    return this.http.get<Estadisticas>(`${this.apiUrl}/estadisticas`, { headers });
  }
}
