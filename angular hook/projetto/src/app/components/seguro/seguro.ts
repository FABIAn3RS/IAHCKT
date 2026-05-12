import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-seguro',
  imports: [CommonModule],
  templateUrl: './seguro.html',
  styleUrl: './seguro.css'
})
export class Seguro implements OnInit, OnDestroy {

  constructor(private http: HttpClient) { }

  ultimoId: number | null = null;
  notificacion = signal<any>(null);
  private intervalo: any;


  backendUrl = 'http://20.104.155.120:3000/veredicto/ultimo';

  ngOnInit() {
    // guarda el id actual al cargar
    this.http.get(this.backendUrl).subscribe((res: any) => {
      if (res.data) this.ultimoId = res.data.id;
    });

    // polling cada 3 segundos
    this.intervalo = setInterval(() => {
      this.http.get(this.backendUrl).subscribe((res: any) => {
        if (res.data && Number(res.data.id) !== Number(this.ultimoId)) {
          this.notificacion.set(res.data);
          this.ultimoId = res.data.id;
        }
      });
    }, 3000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalo);
  }
}