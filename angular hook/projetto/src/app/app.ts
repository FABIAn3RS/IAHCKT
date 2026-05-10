import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Hook } from "./hook/hook";
import { DatosAseguradoFormComponent } from './components/formulario-datos-asegurado/datos-asegurado-form.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Hook, DatosAseguradoFormComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('projetto');
}
