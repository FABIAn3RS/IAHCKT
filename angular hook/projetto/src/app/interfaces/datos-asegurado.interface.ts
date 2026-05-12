export interface DatosAsegurado {
  cedula: string;
  nombre: string;
  motivo_ingreso: string;
  id_hospital: string;
  creado_en: string;
}

export interface Veredicto {
  decision: string;
  alerta: string;
  mensaje_hospital: string;
}

export interface VeredictoResponse {
  data: Veredicto & { id: number; [key: string]: any };
}
