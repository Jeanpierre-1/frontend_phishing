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

  /**
   * Verifica si el usuario actual es administrador
   */
  private isAdmin(): boolean {
    const userRole = localStorage.getItem('userRole');
    return userRole === 'ROLE_ADMIN';
  }

  ngOnInit(): void {
    if (this.isAdmin()) {
      console.log('[ADMIN] AnalisisDetalleComponent inicializado');
    }

    // Obtener ID del análisis desde la ruta
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        const id = parseInt(idParam);
        if (this.isAdmin()) {
          console.log('[ADMIN] ID recibido en ruta:', id);
        }

        // Intentar cargar como ID de análisis
        this.cargarAnalisisPorEnlace(id);
      } else {
        console.warn('No se recibió ID, redirigiendo a home');
        this.router.navigate(['/home']);
      }
    });
  }

  /**
   * Carga el análisis más reciente del enlace
   */
  private cargarAnalisisPorEnlace(enlaceId: number): void {
    if (this.isAdmin()) {
      console.log('[ADMIN] Cargando análisis del enlace ID:', enlaceId);
    }

    this.analisisService.obtenerAnalisisPorEnlace(enlaceId).subscribe({
      next: (analisis) => {
        if (this.isAdmin()) {
          console.log('[ADMIN] Análisis encontrados:', analisis);
        }

        if (analisis && analisis.length > 0) {
          // Tomar el análisis más reciente (último del array)
          this.analisis = analisis[analisis.length - 1];
          if (this.isAdmin()) {
            console.log('[ADMIN] Mostrando análisis más reciente:', this.analisis);
            console.log('[ADMIN] urllength:', this.analisis.urllength);
            console.log('[ADMIN] Todas las propiedades:', Object.keys(this.analisis));
          }
          this.cargando = false;

          setTimeout(() => {
            this.crearGraficos();
          }, 100);
        } else {
          console.warn('No se encontraron análisis para este enlace');
          this.mostrarErrorYRedireccionar('No se encontró el análisis');
        }
      },
      error: (error) => {
        console.error('Error al cargar análisis del enlace:', error);
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
    if (!this.analisis) return;

    // Función auxiliar para limpiar emojis y caracteres especiales
    const limpiarTexto = (texto: string): string => {
      if (!texto) return '';
      // Elimina emojis y otros caracteres Unicode especiales
      return texto.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F910}-\u{1F96B}]|[\u{1F980}-\u{1F9E0}]/gu, '')
        .trim();
    };

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Título
    doc.setFillColor(30, 64, 175); // Azul oscuro elegante
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Reporte de Análisis de Phishing', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('AntiWebPhish - Análisis Detallado', pageWidth / 2, 30, { align: 'center' });

    yPos = 55;
    doc.setTextColor(0, 0, 0);

    // Información del análisis
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175); // Azul para títulos
    doc.text('Resultado del Analisis', 15, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    // URL analizada
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('URL Analizada:', 15, yPos);
    yPos += 5;
    doc.setFontSize(9);
    doc.setTextColor(37, 99, 235); // Azul para URL
    const urlText = this.analisis.enlaceUrl || this.analisis.urlEnlace || 'No disponible';
    const splitUrl = doc.splitTextToSize(urlText, pageWidth - 30);
    doc.text(splitUrl, 15, yPos);
    yPos += splitUrl.length * 5 + 5;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    // Fecha y resultado - usar analysisTimestamp o fecha
    let fechaFormateada = 'No disponible';
    const fechaAnalisis = this.analisis.analysisTimestamp || this.analisis.fecha;

    if (fechaAnalisis) {
      try {
        let fecha: Date;
        if (typeof fechaAnalisis === 'string') {
          // Si es string, parsearlo
          fecha = new Date(fechaAnalisis);
        } else {
          fecha = new Date(fechaAnalisis);
        }

        if (!isNaN(fecha.getTime())) {
          fechaFormateada = fecha.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        }
      } catch (error) {
        console.error('Error al formatear fecha:', error);
      }
    }

    doc.text(`Fecha: ${fechaFormateada}`, 15, yPos);
    yPos += 7;

    const resultado = limpiarTexto(this.analisis.resultado || (this.analisis.isPhishing ? 'PHISHING DETECTADO' : 'Sitio Seguro'));
    const confianza = (this.analisis.probabilityPhishing || this.analisis.confianza || 0) * 100;

    doc.setFont('helvetica', 'bold');
    if (resultado.includes('PHISHING') || resultado.includes('DETECTADO')) {
      doc.setTextColor(220, 38, 38);
    } else {
      doc.setTextColor(16, 185, 129);
    }
    doc.text(`Resultado: ${resultado}`, 15, yPos);
    yPos += 7;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`Probabilidad de Phishing: ${confianza.toFixed(2)}%`, 15, yPos);
    yPos += 7;
    doc.text(`Nivel de Confianza: ${this.analisis.confidence || 'HIGH'}`, 15, yPos);
    yPos += 12;

    // Recomendación
    if (this.analisis.recommendation) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175); // Azul para título
      doc.text('Recomendacion:', 15, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Limpiar la recomendación de emojis y caracteres especiales
      const recomendacionLimpia = limpiarTexto(this.analisis.recommendation);
      const recText = doc.splitTextToSize(recomendacionLimpia, pageWidth - 30);
      doc.text(recText, 15, yPos);
      yPos += recText.length * 5 + 12;
    }

    // Gráfico de Nivel de Riesgo
    const canvasRiesgo = document.getElementById('chartRiesgo') as HTMLCanvasElement;
    if (canvasRiesgo) {
      // Agregar nueva página para el gráfico si es necesario
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('Visualizacion del Nivel de Riesgo', pageWidth / 2, yPos, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPos += 15;

      // Crear canvas temporal con mayor resolución para mejor calidad
      const scale = 2; // Factor de escala para mejor calidad
      const tempCanvas = document.createElement('canvas');
      const originalWidth = canvasRiesgo.width;
      const originalHeight = canvasRiesgo.height;

      tempCanvas.width = originalWidth * scale;
      tempCanvas.height = originalHeight * scale;

      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.scale(scale, scale);
        tempCtx.drawImage(canvasRiesgo, 0, 0);

        // Capturar gráfico de alta resolución
        const imgData = tempCanvas.toDataURL('image/png', 1.0);
        const imgWidth = 120;
        const imgHeight = 120;
        const xPos = (pageWidth - imgWidth) / 2;

        doc.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 20;
      }
    }

    // Características de la URL
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175); // Azul para título
    doc.text('Caracteristicas de la URL', 15, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    // Tabla de Información General
    autoTable(doc, {
      startY: yPos,
      head: [['Característica', 'Valor']],
      body: [
        ['Longitud de URL', `${this.analisis.urlLength || this.analisis.urllength || 'N/A'} caracteres`],
        ['Dominio', this.analisis.domain || 'N/A'],
        ['Longitud del Dominio', `${this.analisis.domainLength || 'N/A'} caracteres`],
        ['Longitud del Path', `${this.analisis.pathLength || 'N/A'} caracteres`],
        ['Protocolo', this.analisis.protocol || 'N/A'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' }, // Azul oscuro
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Tabla de Seguridad
    autoTable(doc, {
      startY: yPos,
      head: [['Indicador de Seguridad', 'Estado']],
      body: [
        ['Tiene HTTPS', this.analisis.hasHttps ? 'Si' : 'No'],
        ['Tiene Query Params', this.analisis.hasQuery ? 'Si' : 'No'],
        ['Número de Subdominios', this.analisis.numberOfSubdomains?.toString() || '0'],
        ['Puntos en Dominio', this.analisis.dotsInDomain?.toString() || '0'],
        ['Guiones en Dominio', this.analisis.hyphensInDomain?.toString() || '0'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' }, // Azul medio
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Nueva página si es necesario
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Tabla de Caracteres
    autoTable(doc, {
      startY: yPos,
      head: [['Analisis de Caracteres', 'Cantidad']],
      body: [
        ['Caracteres Especiales', this.analisis.specialCharactersCount?.toString() || '0'],
        ['Digitos en URL', this.analisis.digitsInUrl?.toString() || '0'],
        ['Digitos en Dominio', this.analisis.digitsInDomain?.toString() || '0'],
        ['Tiene Digitos Repetidos', this.analisis.hasRepeatedDigits ? 'Si' : 'No'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' }, // Azul claro
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Indicadores de Phishing
    if (this.analisis.suspiciousKeywordsCount && this.analisis.suspiciousKeywordsCount > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Indicadores de Phishing', 'Detalle']],
        body: [
          ['Palabras Sospechosas Detectadas', this.analisis.suspiciousKeywordsCount.toString()],
          ['Lista de Palabras', this.analisis.suspiciousKeywords || 'N/A'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' }, // Rojo para alertas
        margin: { left: 15, right: 15 }
      });
    }

    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${pageCount} | Generado: ${new Date().toLocaleString('es-ES')}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Descargar
    const fileName = `reporte-analisis-${this.analisis.id || 'detalle'}-${Date.now()}.pdf`;
    doc.save(fileName);

    Swal.fire({
      icon: 'success',
      title: '¡PDF Generado!',
      text: 'El reporte se ha descargado correctamente',
      confirmButtonColor: '#8b5cf6'
    });
  }

  ngOnDestroy(): void {
    if (this.chartRiesgo) this.chartRiesgo.destroy();
    if (this.chartCaracteristicas) this.chartCaracteristicas.destroy();
  }
}
