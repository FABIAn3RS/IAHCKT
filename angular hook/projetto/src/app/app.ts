import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Hook } from "./hook/hook";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Hook],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('projetto');
}
