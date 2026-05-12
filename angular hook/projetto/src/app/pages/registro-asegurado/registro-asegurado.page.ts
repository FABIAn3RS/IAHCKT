import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatosAseguradoFormComponent } from '../../components/formulario-datos-asegurado/datos-asegurado-form.component';
import { AseguradoService } from '../../services/asegurado.service';
import { DatosAsegurado } from '../../interfaces/datos-asegurado.interface';

@Component({
  selector: 'app-registro-asegurado',
  standalone: true,
  imports: [CommonModule, DatosAseguradoFormComponent],
  templateUrl: './registro-asegurado.page.html',
  styleUrls: ['./registro-asegurado.page.scss'],
})
export class RegistroAseguradoPage implements OnDestroy {
  constructor(public aseguradoService: AseguradoService) {}

  async onFormSubmit(datos: DatosAsegurado): Promise<void> {
    await this.aseguradoService.enviarDatos(datos);
  }

  async consultarUltimo(): Promise<void> {
    await this.aseguradoService.consultarUltimo();
  }

  ngOnDestroy(): void {
    this.aseguradoService.limpiarIntervalo();
  }
}
