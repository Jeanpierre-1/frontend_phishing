import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalisisphishingService, AnalisisPhishing } from '../../services/analisisphishing.service';
import { Chart, registerables } from 'chart.js';
import Swal from 'sweetalert2';

Chart.register(...registerables);

@Component({
  selector: 'app-analisis-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analisis-detalle.component.html',
  styleUrls: ['./analisis-detalle.component.css']
})
export class AnalisisDetalleComponent implements OnInit, OnDestroy {
  analisis: AnalisisPhishing | null = null;
  cargando: boolean = true;

  private chartRiesgo: Chart | null = null;
  private chartCaracteristicas: Chart | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private analisisService: AnalisisphishingService
  ) {}

  ngOnInit(): void {
    console.log('🎬 AnalisisDetalleComponent inicializado');

    // Obtener ID del análisis desde la ruta
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        const id = parseInt(idParam);
        console.log('📍 ID recibido en ruta:', id);

        // Intentar cargar como ID de análisis
        this.cargarAnalisisPorEnlace(id);
      } else {
        console.warn('⚠️ No se recibió ID, redirigiendo a home');
        this.router.navigate(['/home']);
      }
    });
  }

  /**
   * Carga el análisis más reciente del enlace
   */
  private cargarAnalisisPorEnlace(enlaceId: number): void {
    console.log('🔄 Cargando análisis del enlace ID:', enlaceId);

    this.analisisService.obtenerAnalisisPorEnlace(enlaceId).subscribe({
      next: (analisis) => {
        console.log('✅ Análisis encontrados:', analisis);

        if (analisis && analisis.length > 0) {
          // Tomar el análisis más reciente (último del array)
          this.analisis = analisis[analisis.length - 1];
          console.log('✅ Mostrando análisis más reciente:', this.analisis);
          this.cargando = false;

          setTimeout(() => {
            this.crearGraficos();
          }, 100);
        } else {
          console.warn('⚠️ No se encontraron análisis para este enlace');
          this.mostrarErrorYRedireccionar('No se encontró el análisis');
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar análisis del enlace:', error);
        this.mostrarErrorYRedireccionar('No se pudo cargar el análisis');
      }
    });
  }

  /**
   * Muestra error y redirecciona
   */
  private mostrarErrorYRedireccionar(mensaje: string): void {
    this.cargando = false;

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje,
      confirmButtonColor: '#dc2626'
    }).then(() => {
      this.router.navigate(['/reportes']);
    });
  }

  /**
   * Crea los gráficos
   */
  private crearGraficos(): void {
    if (this.analisis) {
      this.crearGraficoRiesgo();
      this.crearGraficoCaracteristicas();
    }
  }

  /**
   * Gráfico de riesgo (donut)
   */
  private crearGraficoRiesgo(): void {
    const canvas = document.getElementById('chartRiesgo') as HTMLCanvasElement;
    if (!canvas || !this.analisis) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chartRiesgo) {
      this.chartRiesgo.destroy();
    }

    const confianza = this.analisis.probabilityPhishing || this.analisis.confianza || 0;

    this.chartRiesgo = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Riesgo', 'Seguro'],
        datasets: [{
          data: [confianza * 100, (1 - confianza) * 100],
          backgroundColor: ['#dc2626', '#10b981'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  /**
   * Gráfico de características
   */
  private crearGraficoCaracteristicas(): void {
    const canvas = document.getElementById('chartCaracteristicas') as HTMLCanvasElement;
    if (!canvas || !this.analisis) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chartCaracteristicas) {
      this.chartCaracteristicas.destroy();
    }

    this.chartCaracteristicas = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['HTTPS', 'Query', 'Subdominios', 'Caracteres Esp.', 'Dígitos', 'Palabras Sospechosas'],
        datasets: [{
          label: 'Características',
          data: [
            this.analisis.hasHttps ? 1 : 0,
            this.analisis.hasQuery ? 1 : 0,
            this.analisis.numberOfSubdomains || 0,
            this.analisis.specialCharactersCount || 0,
            this.analisis.digitsInUrl || 0,
            this.analisis.suspiciousKeywordsCount || 0
          ],
          backgroundColor: [
            '#10b981',
            '#3b82f6',
            '#f59e0b',
            '#ef4444',
            '#8b5cf6',
            '#ec4899'
          ],
          borderColor: [
            '#059669',
            '#2563eb',
            '#d97706',
            '#dc2626',
            '#7c3aed',
            '#db2777'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  /**
   * Obtiene la clase CSS según el nivel de confianza
   */
  getConfianzaClass(confianza: number): string {
    if (confianza >= 0.8) return 'confianza-muy-alta';
    if (confianza >= 0.6) return 'confianza-alta';
    if (confianza >= 0.4) return 'confianza-media';
    if (confianza >= 0.2) return 'confianza-baja';
    return 'confianza-muy-baja';
  }

  /**
   * Vuelve al inicio
   */
  volverAlInicio(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Ver historial completo
   */
  verHistorial(): void {
    this.router.navigate(['/reportes']);
  }

  /**
   * Exportar a PDF
   */
  exportarPDF(): void {
    Swal.fire({
      icon: 'info',
      title: 'Próximamente',
      text: 'La función de exportar PDF estará disponible pronto',
      confirmButtonColor: '#2563eb'
    });
  }

  ngOnDestroy(): void {
    if (this.chartRiesgo) this.chartRiesgo.destroy();
    if (this.chartCaracteristicas) this.chartCaracteristicas.destroy();
  }
}
