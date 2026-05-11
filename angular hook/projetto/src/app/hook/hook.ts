import { Component, OnInit, OnDestroy, ChangeDetectorRef, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Signal } from '@angular/core';

@Component({
  selector: 'app-hook',
  imports: [CommonModule],
  templateUrl: './hook.html',
  styleUrl: './hook.css',
})
export class Hook {

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }
  veredicto: any = null;
  cargando = false;
  private intervalo: any;
  ultimoId: number | null = null;
  cartelera = signal<any>(null);


  datos = {
    cedula: '1712345678',
    nombre: "PACO MAN",
    motivo_ingreso: 'DESGARRE MUSCULAR',
    hospitalid: 'HOSP123',
    timestamp: new Date().toISOString()
  }

  url = 'http://localhost:5678/webhook-test/comprobacion';
  backendUrl = 'http://localhost:3000/veredicto/ultimo';


  async CONSULTA() {

    this.cartelera.set(await firstValueFrom(this.http.get(this.backendUrl)));
    this.ultimoId = this.cartelera().data.id;
    console.log("Cartelera inicial:", this.cartelera());

  }

  async enviarDatos() {
    this.cargando = true;
    this.veredicto = null;
    try {
      const result = await firstValueFrom(this.http.post(this.url, this.datos));
      console.log("enviando a n8n:", result);

      // n8n devuelve el id en la respuesta
      const id = (result as any).id;

      this.intervalo = setInterval(async () => {
        const res: any = await firstValueFrom(
          this.http.get(`http://localhost:3000/veredicto/${id}`)
        );
        console.log('polling por id:', id, res);

        if (res.data) {
          clearInterval(this.intervalo);
          this.cartelera.set(res);
          this.cargando = false;
        }
      }, 3000);

    } catch (error) {
      console.log("error en subida a N8N");
      this.cargando = false;
    }
  }
}