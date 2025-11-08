import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AnalisisphishingService,
  AnalisisPhishingDTO,
  PhishingDetectionResponse

} from '../../services/analisisphishing.service';
import { EnlaceService, EnlaceDTO } from '../../services/enlace.service';
import { Enlace } from '../../models/enlace';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  // Formulario
  urlAnalisis: string = '';
  mensajeCompleto: string = '';
  aplicacion: string = 'web';
  isAnalyzing: boolean = false;

  // Resultado
  mostrarResultado: boolean = false;
  esPhishing: boolean = false;
  nivelRiesgo: number = 0;
  detalles: string[] = [];
  recomendaciones: string[] = [];
  porcentajeRiesgo: number = 0;
  analisisId: number | null = null;
  enlaceId: number | null = null; // ✅ AGREGAR: Para guardar el ID del enlace

  constructor(
    private analisisService: AnalisisphishingService,
    private enlaceService: EnlaceService,
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Método principal para analizar URL
   */
  analizarAhora(): void {
    const urlValidada = this.validarYNormalizarURL();

    if (!urlValidada) {
      this.mostrarErrorValidacion();
      return;
    }

    this.iniciarAnalisis();
    this.ejecutarFlujoDeAnalisis(urlValidada);
  }

  /**
   * Valida y normaliza la URL ingresada
   */
  private validarYNormalizarURL(): string | null {
    const url = this.urlAnalisis.trim();

    if (!url) {
      return null;
    }

    // Agregar protocolo si no existe
    let urlNormalizada = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      urlNormalizada = 'https://' + url;
    }

    // Validar formato
    try {
      new URL(urlNormalizada);
      return urlNormalizada;
    } catch (error) {
      return null;
    }
  }

  /**
   * Muestra error de validación
   */
  private mostrarErrorValidacion(): void {
    Swal.fire({
      icon: 'warning',
      title: 'URL Inválida',
      text: 'Por favor ingrese una URL válida (ejemplo: https://ejemplo.com)',
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Entendido'
    });
  }

  /**
   * Inicializa el estado para el análisis
   */
  private iniciarAnalisis(): void {
    this.isAnalyzing = true;
    this.mostrarResultado = false;
    this.analisisId = null;
  }

  /**
   * Ejecuta el flujo completo de análisis
   */
  private ejecutarFlujoDeAnalisis(url: string): void {
    console.log('🚀 Iniciando análisis para:', url);

    // PASO 1: Guardar el enlace en BD
    this.guardarEnlace(url);
  }

// ...existing code...

  /**
   * Analiza la URL usando el servicio de detección de phishing
   */
 private analizarURL(url: string, enlaceId: number): void {
  console.log('🔎 Analizando URL:', url, 'con enlaceId:', enlaceId);

  // ✅ El backend ya guarda el análisis automáticamente
  this.analisisService.analizarUrl(url, enlaceId).subscribe({
    next: (respuesta: PhishingDetectionResponse) => {
      console.log('✅ Análisis completado:', respuesta);
      console.log('✅ EnlaceId recibido del backend:', respuesta.enlaceId);

      // ✅ Usar el enlaceId como analisisId (el backend devuelve el análisis guardado)
      this.analisisId = enlaceId; // Temporal: usar enlaceId hasta que el backend devuelva analisisId
      this.enlaceId = enlaceId;

      console.log('✅ analisisId asignado:', this.analisisId);

      // Mostrar resultado directamente
      this.procesarYMostrarResultado(respuesta);
    },
    error: (error) => {
      console.error('❌ Error al analizar URL:', error);
      this.finalizarConErrorAnalisis(error);
    }
  });
}

  /**
   * Muestra mensaje cuando el usuario no está autenticado
   */
  private mostrarMensajeNoAutenticado(): void {
    this.isAnalyzing = false;

    Swal.fire({
      icon: 'info',
      title: '🔐 Iniciar Sesión Requerido',
      text: 'Debes iniciar sesión para guardar y analizar enlaces',
      showCancelButton: true,
      confirmButtonText: 'Iniciar Sesión',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/home' }
        });
      }
    });
  }

  /**
   * Maneja errores al analizar URL
   */


  // ...existing code...





  /**
   * Guarda el enlace en la base de datos
   */
private guardarEnlace(url: string): void {
  // ✅ Obtener el usuarioId desde localStorage
  const usuarioIdStr = localStorage.getItem('usuarioId');

  console.log('=== VERIFICACIÓN DE DATOS ===');
  console.log('Token:', localStorage.getItem('token'));
  console.log('UsuarioId string:', usuarioIdStr);
  console.log('Username:', localStorage.getItem('username'));

  if (!usuarioIdStr) {
    console.error('❌ No hay usuarioId en localStorage');
    this.mostrarMensajeNoAutenticado();
    return;
  }

  const usuarioId = parseInt(usuarioIdStr);

  console.log('UsuarioId parseado:', usuarioId);
  console.log('Es número válido?:', !isNaN(usuarioId));

  // ✅ Construir el DTO completo
  const enlaceDTO: EnlaceDTO = {
    url: url,
    aplicacion: this.aplicacion || 'web',
    mensaje: this.mensajeCompleto.trim() || 'Análisis desde página principal',
    usuarioId: usuarioId
  };

  console.log('📋 DTO construido:', enlaceDTO);
  console.log('📋 Tipo de cada campo:', {
    url: typeof enlaceDTO.url,
    aplicacion: typeof enlaceDTO.aplicacion,
    mensaje: typeof enlaceDTO.mensaje,
    usuarioId: typeof enlaceDTO.usuarioId
  });

  this.enlaceService.crearEnlace(enlaceDTO).subscribe({
    next: (enlace: Enlace) => {
      console.log('✅ Enlace guardado exitosamente:', enlace);

      if (!enlace.id) {
        console.error('❌ El enlace no tiene ID');
        this.finalizarConError('El enlace se guardó pero no tiene ID');
        return;
      }

      // ✅ AGREGAR: Guardar el enlaceId para usar en el reporte
      this.enlaceId = enlace.id;

      // PASO 2: Analizar la URL
      this.analizarURL(url, enlace.id);
    },
    error: (error) => {
      console.error('❌ Error al guardar enlace:', error);
      console.error('📄 Detalles completos del error:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error,
        headers: error.headers
      });

      this.finalizarConErrorGuardado(error);
    }
  });
}






  /**
   * Guarda el resultado del análisis en BD
   */
  private guardarResultadoAnalisis(enlaceId: number, respuesta: PhishingDetectionResponse): void {
  // ✅ CORRECCIÓN: Usar los campos correctos de la respuesta
  const confianza = respuesta.probabilityPhishing || 0;

  const analisisDTO: AnalisisPhishingDTO = {
    enlaceId: enlaceId,
    resultado: respuesta.isPhishing ? 'PHISHING' : 'SEGURO',
    confianza: confianza,
    detalles: respuesta.message || 'Sin detalles adicionales'
  };

  console.log('💾 Guardando resultado de análisis:', analisisDTO);

  this.analisisService.crearAnalisis(analisisDTO).subscribe({
    next: (analisis) => {
      console.log('✅ Análisis guardado:', analisis);
      console.log('✅ ID del análisis recibido:', analisis.id);
      this.analisisId = analisis.id || null;
      console.log('✅ this.analisisId asignado:', this.analisisId);

      // ✅ CORRECCIÓN: Asegurarse de que enlaceId se mantenga
      if (!this.enlaceId && analisis.enlaceId) {
        this.enlaceId = analisis.enlaceId;
      }

      // PASO 4: Mostrar resultado
      this.procesarYMostrarResultado(respuesta);
    },
    error: (error) => {
      console.error('❌ ERROR al guardar análisis:', error);
      console.error('❌ No se pudo guardar, this.analisisId será null');

      // Mostrar resultado aunque falle el guardado
      this.procesarYMostrarResultado(respuesta);
    }
  });
}

  /**
   * Procesa la respuesta y muestra el resultado en UI
   */
  /**
 * Procesa la respuesta y muestra el resultado en UI
 */
private procesarYMostrarResultado(respuesta: PhishingDetectionResponse): void {
  // ✅ CORRECCIÓN: Usar isPhishing en lugar de esPhishing
  this.esPhishing = respuesta.isPhishing || false;

  // ✅ CORRECCIÓN: Usar probabilityPhishing
  const probability = respuesta.probabilityPhishing || 0;

  console.log('📊 DEBUG - Probability recibida:', probability);
  console.log('📊 DEBUG - Tipo:', typeof probability);

  // Calcular nivel de riesgo
  this.calcularNivelRiesgo(probability);

  // Configurar detalles y recomendaciones
  this.configurarDetallesYRecomendaciones(this.esPhishing);

  // Mostrar resultado
  this.mostrarResultadoEnUI();

  // Finalizar carga
  this.isAnalyzing = false;
}

  /**
   * Calcula el nivel de riesgo en escala de 1-5
   */
  private calcularNivelRiesgo(confianza: number): void {
    this.porcentajeRiesgo = Math.round(confianza * 100);

    if (this.porcentajeRiesgo >= 80) {
      this.nivelRiesgo = 5;
    } else if (this.porcentajeRiesgo >= 60) {
      this.nivelRiesgo = 4;
    } else if (this.porcentajeRiesgo >= 40) {
      this.nivelRiesgo = 3;
    } else if (this.porcentajeRiesgo >= 20) {
      this.nivelRiesgo = 2;
    } else {
      this.nivelRiesgo = 1;
    }
  }

  /**
   * Configura los detalles y recomendaciones según el resultado
   */
  private configurarDetallesYRecomendaciones(esPhishing: boolean): void {
    if (esPhishing) {
      this.detalles = [
        'Redirección sospechosa detectada',
        'Dominio no verificado',
        'Certificado SSL inválido o ausente',
        'Posible intento de suplantación de identidad'
      ];

      this.recomendaciones = [
        'NO abras el enlace',
        'Reporta al contacto que te envió esto',
        'Marca este link como spam',
        'Activa tu Autenticación en 2 pasos',
        'Actualiza tu antivirus'
      ];
    } else {
      this.detalles = [
        'URL verificada correctamente',
        'Dominio legítimo y registrado',
        'Certificado SSL válido',
        'No se detectaron patrones de phishing'
      ];

      this.recomendaciones = [
        'El sitio parece seguro',
        'Verifica siempre la URL completa antes de ingresar datos',
        'Busca el candado de seguridad en el navegador',
        'Mantén tu dispositivo actualizado'
      ];
    }
  }

  /**
   * Muestra el resultado en la interfaz
   */
  private mostrarResultadoEnUI(): void {
    this.mostrarResultado = true;

    // Scroll suave al resultado después de renderizar
    setTimeout(() => {
      const elemento = document.getElementById('resultado-analisis');
      if (elemento) {
        elemento.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 150);
  }

  /**
   * Finaliza con error genérico
   */
  private finalizarConError(mensaje: string): void {
    this.isAnalyzing = false;

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje,
      confirmButtonColor: '#2563eb'
    });
  }

  /**
   * Maneja error al guardar enlace
   */
  private finalizarConErrorGuardado(error: any): void {
    this.isAnalyzing = false;

    const statusCode = error.status || 'Desconocido';
    const mensaje = error.error?.message || error.message || 'Error de conexión con el servidor';

    Swal.fire({
      icon: 'error',
      title: `Error al Guardar Enlace (${statusCode})`,
      html: `
        <div style="text-align: left; padding: 15px;">
          <p style="margin-bottom: 15px;"><strong>Descripción del error:</strong></p>
          <p style="color: #666; font-size: 14px; margin-bottom: 20px;">${mensaje}</p>

          <hr style="margin: 20px 0;">

          <p style="margin-bottom: 10px;"><strong>Verificaciones necesarias:</strong></p>
          <ul style="font-size: 13px; color: #666; line-height: 1.8;">
            <li>✓ Backend corriendo en <code>http://localhost:8080</code></li>
            <li>✓ Base de datos MySQL activa y accesible</li>
            <li>✓ Configuración CORS correcta en el servidor</li>
            <li>✓ Tabla 'enlace' existe en la base de datos</li>
          </ul>
        </div>
      `,
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Entendido',
      width: '600px'
    });
  }

  /**
   * Maneja error al analizar URL
   */
  private finalizarConErrorAnalisis(error: any): void {
    this.isAnalyzing = false;

    const mensaje = error.error?.message || error.message || 'Error desconocido en el servicio de análisis';

    Swal.fire({
      icon: 'error',
      title: 'Error en el Análisis',
      html: `
        <div style="text-align: left; padding: 15px;">
          <p style="margin-bottom: 15px;"><strong>No se pudo analizar la URL:</strong></p>
          <p style="color: #666; font-size: 14px; margin-bottom: 20px;">${mensaje}</p>

          <p style="font-size: 13px; color: #999;">
            Verifique que el servicio de análisis de phishing esté funcionando correctamente.
          </p>
        </div>
      `,
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Entendido'
    });
  }
isAuthenticated(): boolean {
  return this.authService.isAuthenticated();
}
  /**
   * Navega al reporte completo (requiere autenticación)
   */
 /**
 * Navega al reporte completo pasando el análisis actual
 */
verReporteCompleto(): void {
  console.log('🔍 DEBUG - verReporteCompleto()');
  console.log('🔍 enlaceId:', this.enlaceId);
  console.log('🔍 analisisId:', this.analisisId);

  if (!this.authService.isAuthenticated()) {
    Swal.fire({
      icon: 'info',
      title: '🔐 Iniciar Sesión Requerido',
      text: 'Debes iniciar sesión para acceder al reporte completo',
      showCancelButton: true,
      confirmButtonText: 'Iniciar Sesión',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/home' }
        });
      }
    });
    return;
  }

  // ✅ Navegar al nuevo componente de detalle de análisis
  if (this.analisisId) {
    console.log('✅ Navegando a análisis específico ID:', this.analisisId);
    this.router.navigate(['/analisis', this.analisisId]);
  } else {
    // Sin análisis específico, mostrar historial completo
    console.log('⚠️ No hay análisis ID, navegando a historial');
    this.router.navigate(['/reportes']);
  }
}

  /**
   * Retorna array para ngFor de barras de riesgo
   */
  getNivelRiesgoArray(): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  /**
   * Limpia el formulario y resultado
   */
  limpiarFormulario(): void {
    this.urlAnalisis = '';
    this.mensajeCompleto = '';
    this.aplicacion = 'web';
    this.mostrarResultado = false;
    this.analisisId = null;
    this.enlaceId = null; // ✅ AGREGAR: Limpiar también el enlaceId
    this.esPhishing = false;
    this.nivelRiesgo = 0;
    this.porcentajeRiesgo = 0;
    this.detalles = [];
    this.recomendaciones = [];
  }

  /**
   * Analiza otra URL (limpia y resetea)
   */
  analizarOtraURL(): void {
    this.limpiarFormulario();

    // Scroll al formulario
    setTimeout(() => {
      const elemento = document.querySelector('.form-section');
      if (elemento) {
        elemento.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  }
}
