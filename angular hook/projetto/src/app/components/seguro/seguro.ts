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
  notificacion = signal<any[]>([]);
  private intervalo: any;


  backendUrl = 'https://arrival-clover-gents.ngrok-free.dev/veredicto/ultimo';

  ngOnInit() {
    this.http.get(this.backendUrl).subscribe((res: any) => {
      if (res.data && res.data.length > 0) {
        this.ultimoId = res.data[0].id;
        this.notificacion.set(res.data); // muestra los 5 al cargar
      }
    });

    this.intervalo = setInterval(() => {
      this.http.get(this.backendUrl).subscribe((res: any) => {
        if (res.data && res.data.length > 0 &&
          Number(res.data[0].id) !== Number(this.ultimoId)) {
          this.notificacion.set(res.data);
          this.ultimoId = res.data[0].id;
        }
      });
    }, 3000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalo);
  }
}
