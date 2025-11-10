import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalisisphishingService, AnalisisPhishing } from '../../services/analisisphishing.service';
import { Chart, registerables } from 'chart.js';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

Chart.register(...registerables);

@Component({
  selector: 'app-reporte',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reporte.component.html',
  styleUrls: ['./reporte.component.css']
})
export class ReporteComponent implements OnInit, OnDestroy {
  Math = Math; // Para usar Math en el template

  analisisActual: AnalisisPhishing | null = null;
  analisisId: number | null = null;
  enlaceId: number | null = null; // ✅ AGREGAR: Para filtrar por enlace específico
  historialAnalisis: AnalisisPhishing[] = [];

  // Paginación
  paginaActual: number = 1;
  registrosPorPagina: number = 10;
  totalPaginas: number = 0;

  // Estadísticas
  totalAnalisis: number = 0;
  phishingDetectado: number = 0;
  seguros: number = 0;
  porcentajePhishing: number = 0;

  // Gráficos
  private chartRiesgo: Chart | null = null;
  private chartHistorial: Chart | null = null;
  private chartCaracteristicas: Chart | null = null;

  // Estado
  cargando: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private analisisService: AnalisisphishingService
  ) {}

  ngOnInit(): void {
    console.log('🎬 ReporteComponent inicializado');

    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token, redirigiendo a login');
      this.router.navigate(['/login']);
      return;
    }

    // Obtener parámetros de la ruta
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      console.log('📋 ID de análisis desde ruta:', idParam);

      if (idParam) {
        this.analisisId = parseInt(idParam);
        this.cargarAnalisisEspecifico(this.analisisId);
      } else {
        this.cargarHistorialGeneral();
      }
    });

    // NUEVO: Obtener enlaceId de query params
    this.route.queryParamMap.subscribe(queryParams => {
      const enlaceIdParam = queryParams.get('enlaceId');
      console.log('EnlaceId desde query params:', enlaceIdParam);

      if (enlaceIdParam) {
        this.enlaceId = parseInt(enlaceIdParam);
      }
    });
  }

  /**
   * Carga un análisis específico - SOLO ESE ANÁLISIS
   */
  private cargarAnalisisEspecifico(id: number): void {
    console.log('🔄 Cargando análisis específico ID:', id);

    this.analisisService.obtenerAnalisisPorId(id).subscribe({
      next: (analisis) => {
        console.log('Análisis específico cargado:', analisis);
        this.analisisActual = analisis;

        // Solo mostrar este análisis, no cargar historial adicional
        this.historialAnalisis = [analisis]; // Solo el análisis actual
        this.calcularEstadisticas();
        this.cargando = false;

        setTimeout(() => {
          this.crearGraficos();
        }, 100);
      },
      error: (error) => {
        console.error('Error al cargar análisis específico:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el análisis específico',
          confirmButtonColor: '#dc2626'
        });
        this.cargando = false;
      }
    });
  }

  /**
   * Carga el historial general
   */
  private cargarHistorialGeneral(): void {
    console.log('Cargando historial general');
    this.cargarHistorial();
  }

  /**
   * Carga el historial completo DEL USUARIO ACTUAL
   * El backend filtra automáticamente por el token JWT
   */
  private cargarHistorial(): void {
    console.log('Obteniendo historial de análisis del usuario actual...');

    // Si hay enlaceId, filtrar por enlace específico
    if (this.enlaceId) {
      console.log('Filtrando por enlace ID:', this.enlaceId);
      this.cargarHistorialPorEnlace(this.enlaceId);
      return;
    }

    // El backend filtra automáticamente por el usuario autenticado (via @AuthenticationPrincipal)
    this.analisisService.obtenerAnalisis().subscribe({
      next: (analisis) => {
        console.log('Historial del usuario cargado:', analisis.length, 'registros');
        this.historialAnalisis = analisis;
        this.calcularEstadisticas();
        this.calcularTotalPaginas(); // Calcular paginación
        this.cargando = false;

        // Crear gráficos después de cargar datos
        setTimeout(() => {
          this.crearGraficos();
        }, 100);
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        this.cargando = false;

        Swal.fire({
          icon: 'error',
          title: 'Error al cargar historial',
          text: error.error?.message || 'No se pudo cargar el historial',
          confirmButtonColor: '#dc2626'
        });
      }
    });
  }

  /**
   *NUEVO: Carga el historial filtrado por enlace específico
   */
  private cargarHistorialPorEnlace(enlaceId: number): void {
    console.log('Obteniendo análisis del enlace ID:', enlaceId);

    this.analisisService.obtenerAnalisisPorEnlace(enlaceId).subscribe({
      next: (analisis) => {
        console.log('Análisis del enlace cargados:', analisis.length, 'registros');
        this.historialAnalisis = analisis;
        this.calcularEstadisticas();
        this.cargando = false;

        // Crear gráficos después de cargar datos
        setTimeout(() => {
          this.crearGraficos();
        }, 100);
      },
      error: (error) => {
        console.error('Error al cargar análisis del enlace:', error);
        this.cargando = false;

        Swal.fire({
          icon: 'error',
          title: 'Error al cargar análisis',
          text: error.error?.message || 'No se pudo cargar el análisis del enlace',
          confirmButtonColor: '#dc2626'
        });
      }
    });
  }

  /**
   * Calcula las estadísticas
   */
  private calcularEstadisticas(): void {
    this.totalAnalisis = this.historialAnalisis.length;

    // Contar phishing detectados
    this.phishingDetectado = this.historialAnalisis.filter(a =>
      a.isPhishing === true || a.resultado === 'PHISHING'
    ).length;

    this.seguros = this.totalAnalisis - this.phishingDetectado;

    this.porcentajePhishing = this.totalAnalisis > 0
      ? Math.round((this.phishingDetectado / this.totalAnalisis) * 100)
      : 0;

    console.log('Estadísticas:', {
      total: this.totalAnalisis,
      phishing: this.phishingDetectado,
      seguros: this.seguros,
      porcentaje: this.porcentajePhishing
    });
  }

  /**
   Crea todos los gráficos
   */
  private crearGraficos(): void {
    if (this.analisisActual) {
      this.crearGraficoRiesgo();
      this.crearGraficoCaracteristicas();
    }

    if (this.historialAnalisis.length > 0) {
      this.crearGraficoHistorial();
    }
  }

  /*
   Gráfico de riesgo (donut)
   */
  private crearGraficoRiesgo(): void {
    const canvas = document.getElementById('chartRiesgo') as HTMLCanvasElement;
    if (!canvas || !this.analisisActual) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chartRiesgo) {
      this.chartRiesgo.destroy();
    }

    const confianza = this.analisisActual.probabilityPhishing || this.analisisActual.confianza || 0;

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
   *  Gráfico de historial (bar)
   */
  private crearGraficoHistorial(): void {
    const canvas = document.getElementById('chartHistorial') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chartHistorial) {
      this.chartHistorial.destroy();
    }

    this.chartHistorial = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Phishing', 'Seguros'],
        datasets: [{
          data: [this.phishingDetectado, this.seguros],
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
   *  Gráfico de características
   */
  private crearGraficoCaracteristicas(): void {
    const canvas = document.getElementById('chartCaracteristicas') as HTMLCanvasElement;
    if (!canvas || !this.analisisActual) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chartCaracteristicas) {
      this.chartCaracteristicas.destroy();
    }

    const analisis = this.analisisActual;

    this.chartCaracteristicas = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['HTTPS', 'Query', 'Subdominios', 'Caracteres Especiales', 'Dígitos'],
        datasets: [{
          label: 'Características',
          data: [
            analisis.hasHttps ? 1 : 0,
            analisis.hasQuery ? 1 : 0,
            analisis.numberOfSubdomains || 0,
            analisis.specialCharactersCount || 0,
            analisis.digitsInUrl || 0
          ],
          backgroundColor: '#2563eb',
          borderColor: '#1e40af',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  /**
   *  Obtiene la clase CSS según el nivel de confianza
   */
  getConfianzaClass(confianza: number): string {
    if (confianza >= 0.8) return 'confianza-muy-alta';
    if (confianza >= 0.6) return 'confianza-alta';
    if (confianza >= 0.4) return 'confianza-media';
    if (confianza >= 0.2) return 'confianza-baja';
    return 'confianza-muy-baja';
  }

  /**
   *  Navega al análisis específico de un enlace
   */
  verAnalisisEspecifico(enlaceId: number | undefined): void {
    if (!enlaceId || enlaceId === 0) {
      console.warn('No se recibió enlaceId válido');
      Swal.fire({
        icon: 'warning',
        title: 'ID no válido',
        text: 'No se puede mostrar el análisis sin un ID válido',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    console.log('Navegando al análisis del enlace ID:', enlaceId);
    this.router.navigate(['/analisis', enlaceId]);
  }

  /**
   *  Ver detalles de un análisis
   */
  verDetallesAnalisis(analisis: AnalisisPhishing): void {
    const confianza = analisis.probabilityPhishing || analisis.confianza || 0;
    const url = analisis.urlEnlace || analisis.enlaceUrl || 'N/A';

    Swal.fire({
      title: 'Detalles del Análisis',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>🔗 URL:</strong> ${url}</p>
          <p><strong>📊 Resultado:</strong> ${analisis.isPhishing ? '⚠️ Phishing' : '✅ Seguro'}</p>
          <p><strong>🎯 Confianza:</strong> ${(confianza * 100).toFixed(2)}%</p>
          <p><strong>📅 Fecha:</strong> ${new Date(analisis.analysisTimestamp || analisis.fecha || '').toLocaleString()}</p>
          ${analisis.message ? `<p><strong>💬 Mensaje:</strong> ${analisis.message}</p>` : ''}
          ${analisis.recommendation ? `<p><strong>💡 Recomendación:</strong> ${analisis.recommendation}</p>` : ''}
        </div>
      `,
      confirmButtonColor: '#2563eb',
      width: '600px'
    });
  }

  /**
   * Elimina un análisis
   */
  eliminarAnalisis(analisis: AnalisisPhishing): void {
    const url = analisis.urlEnlace || analisis.enlaceUrl || 'N/A';

    Swal.fire({
      title: '¿Eliminar análisis?',
      html: `<p>¿Estás seguro de eliminar el análisis de:</p><p><strong>${url}</strong></p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && analisis.id) {
        this.analisisService.eliminarAnalisis(analisis.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: '¡Eliminado!',
              text: 'El análisis ha sido eliminado correctamente',
              confirmButtonColor: '#10b981',
              timer: 2000
            });

            // Recargar el historial
            this.cargarHistorial();
          },
          error: (error) => {
            console.error('Error al eliminar análisis:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el análisis',
              confirmButtonColor: '#dc2626'
            });
          }
        });
      }
    });
  }  /**
   * Navega al inicio
   */
  volverAlInicio(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Exportar historial de análisis a PDF
   */
  exportarPDF(): void {
    // Función auxiliar para limpiar emojis
    const limpiarTexto = (texto: string): string => {
      if (!texto) return '';
      return texto.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F910}-\u{1F96B}]|[\u{1F980}-\u{1F9E0}]/gu, '')
        .trim();
    };

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Encabezado
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Historial de Analisis de Phishing', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('AntiWebPhish - Reporte Completo', pageWidth / 2, 30, { align: 'center' });

    yPos = 55;

    // Estadísticas Generales
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('Estadisticas Generales', 15, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Analisis: ${this.totalAnalisis}`, 15, yPos);
    yPos += 7;
    doc.text(`Phishing Detectado: ${this.phishingDetectado}`, 15, yPos);
    yPos += 7;
    doc.text(`Sitios Seguros: ${this.seguros}`, 15, yPos);
    yPos += 7;
    doc.text(`Porcentaje de Amenazas: ${this.porcentajePhishing.toFixed(2)}%`, 15, yPos);
    yPos += 20;

    // Historial de Análisis
    if (this.historialAnalisis.length > 0) {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('Historial de Analisis', 15, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 10;

      // Preparar datos para la tabla
      const tableData = this.historialAnalisis.map((analisis, index) => {
        const fecha = analisis.analysisTimestamp || analisis.fecha;
        let fechaFormateada = 'N/A';
        if (fecha) {
          try {
            const fechaObj = new Date(fecha);
            if (!isNaN(fechaObj.getTime())) {
              fechaFormateada = fechaObj.toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            }
          } catch (error) {
            fechaFormateada = 'N/A';
          }
        }

        const url = analisis.enlaceUrl || analisis.urlEnlace || 'N/A';
        const urlCorta = url.length > 40 ? url.substring(0, 40) + '...' : url;
        const resultado = limpiarTexto(analisis.resultado || (analisis.isPhishing ? 'PHISHING' : 'SEGURO'));
        const confianza = ((analisis.probabilityPhishing || analisis.confianza || 0) * 100).toFixed(1) + '%';

        return [
          (index + 1).toString(),
          fechaFormateada,
          urlCorta,
          resultado,
          confianza
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Fecha', 'URL', 'Resultado', 'Confianza']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 35 },
          2: { cellWidth: 70 },
          3: { cellWidth: 35 },
          4: { cellWidth: 25 }
        },
        margin: { left: 15, right: 15 },
        didParseCell: function(data) {
          // Colorear la columna de resultado
          if (data.column.index === 3 && data.section === 'body') {
            const resultado = data.cell.text[0];
            if (resultado.includes('PHISHING') || resultado.includes('DETECTADO')) {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = 'bold';
            } else if (resultado.includes('SEGURO')) {
              data.cell.styles.textColor = [16, 185, 129];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });
    }

    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Pagina ${i} de ${pageCount} | Generado: ${new Date().toLocaleString('es-ES')}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Descargar
    const fileName = `historial-analisis-${Date.now()}.pdf`;
    doc.save(fileName);

    Swal.fire({
      icon: 'success',
      title: 'PDF Generado!',
      text: 'El historial se ha descargado correctamente',
      confirmButtonColor: '#2563eb'
    });
  }

  /**
   * Obtener análisis paginados
   */
  get analisisPaginados(): AnalisisPhishing[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    return this.historialAnalisis.slice(inicio, fin);
  }

  /**
   * Calcular total de páginas
   */
  calcularTotalPaginas(): void {
    this.totalPaginas = Math.ceil(this.historialAnalisis.length / this.registrosPorPagina);
  }

  /**
   * Cambiar de página
   */
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  /**
   * Ir a la página anterior
   */
  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  /**
   * Ir a la página siguiente
   */
  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  /**
   * Obtener array de números de página para mostrar
   */
  get paginasVisibles(): number[] {
    const paginas: number[] = [];
    const maxPaginas = 5;
    let inicio = Math.max(1, this.paginaActual - Math.floor(maxPaginas / 2));
    let fin = Math.min(this.totalPaginas, inicio + maxPaginas - 1);

    if (fin - inicio < maxPaginas - 1) {
      inicio = Math.max(1, fin - maxPaginas + 1);
    }

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  }

  /**
   * Limpia los gráficos al destruir el componente
   */
  ngOnDestroy(): void {
    if (this.chartRiesgo) this.chartRiesgo.destroy();
    if (this.chartHistorial) this.chartHistorial.destroy();
    if (this.chartCaracteristicas) this.chartCaracteristicas.destroy();
  }
}
