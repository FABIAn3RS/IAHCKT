import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hook',
  imports: [CommonModule],
  templateUrl: './hook.html',
  styleUrl: './hook.css',
})
export class Hook implements OnInit, OnDestroy {

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }
  veredicto: any = null;
  cargando = false;
  private intervalo: any;
  ultimoId: number | null = null;


  datos = {
    cedula: '1712345678',
    nombre: 'John Doe',
    motivo_ingreso: 'Consulta médica',
    hospitalid: 'HOSP123',
    timestamp: new Date().toISOString()
  }

  url = 'http://localhost:5678/webhook-test/comprobacion';
  backendUrl = 'http://localhost:3000/veredicto/ultimo';

  ngOnInit() {
    // Guarda el id actual antes de enviar
    this.http.get(this.backendUrl).subscribe((res: any) => {
      if (res.data) this.ultimoId = res.data.id;
    });

    this.intervalo = setInterval(() => {
      this.http.get(this.backendUrl).subscribe((res: any) => {
        console.log('polling - id recibido:', res.data?.id, 'ultimoId:', this.ultimoId);
        if (res.data && Number(res.data.id) !== Number(this.ultimoId)) {
          this.veredicto = res.data;
          this.ultimoId = res.data.id;
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
    }, 3000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalo);
  }

  async enviarDatos() {
    this.cargando = true;
    this.veredicto = null;
    try {
      const result = await firstValueFrom(this.http.post(this.url, this.datos));
      console.log("enviando a n8n:", result);
    } catch (error) {
      console.log("error en subida a N8N");
    }
  }
}