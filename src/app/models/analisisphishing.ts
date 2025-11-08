export interface AnalisisPhishing {
   id?: number;
  enlace?: any;
  enlaceId?: number;
  enlaceUrl?: string;
  resultado: string;
  confianza: number;
  detalles?: string;
  fecha?: Date | string;
  usuario?: any;
  usuarioId?: number;
}

