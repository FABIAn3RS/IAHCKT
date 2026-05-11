import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RegistroAseguradoPage } from './pages/registro-asegurado/registro-asegurado.page';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RegistroAseguradoPage],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('projetto');
}
