import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DatosAsegurado, Veredicto, VeredictoResponse } from '../interfaces/datos-asegurado.interface';

@Injectable({ providedIn: 'root' })
export class AseguradoService {
  private readonly webhookUrl = 'https://gone-tools-routers-unknown.trycloudflare.com/webhook/comprobacion';
  private readonly backendUrl = 'https://reasoning-ciao-aside-marked.trycloudflare.com/veredicto/ultimo';

  // Ambos como signals para que Angular detecte cambios dentro de setInterval
  cargando = signal(false);
  veredicto = signal<Veredicto | null>(null);

  private intervalo: any;

  constructor(private http: HttpClient) {}

  /** Obtiene el último veredicto registrado */
  async consultarUltimo(): Promise<void> {
    const res = await firstValueFrom(
      this.http.get<VeredictoResponse>(`${this.backendUrl}/ultimo`)
    );
    this.setVeredicto(res);
  }

  /** Envía los datos del asegurado al webhook y hace polling hasta recibir el veredicto */
  async enviarDatos(datos: DatosAsegurado): Promise<void> {
    this.limpiarIntervalo();
    this.cargando.set(true);
    this.veredicto.set(null);

    try {
      const result = await firstValueFrom(
        this.http.post<{ id: number }>(this.webhookUrl, datos)
      );
      console.log('Enviado a n8n:', result);

      const id = result.id;

      this.intervalo = setInterval(async () => {
        try {
          const res = await firstValueFrom(
            this.http.get<VeredictoResponse>(`${this.backendUrl}/${id}`)
          );
          console.log('Polling id:', id, res);

          if (res?.data) {
            this.limpiarIntervalo();
            this.setVeredicto(res);
            this.cargando.set(false);
          }
        } catch (e) {
          console.warn('Error en polling, reintentando...', e);
        }
      }, 3000);

    } catch (error) {
      console.error('Error al enviar a n8n:', error);
      this.cargando.set(false);
    }
  }

  private setVeredicto(res: VeredictoResponse): void {
    const { decision, alerta, mensaje_hospital } = res.data;
    this.veredicto.set({ decision, alerta, mensaje_hospital });
  }

  limpiarIntervalo(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
    }
  }
}
