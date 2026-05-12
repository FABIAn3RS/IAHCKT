import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  constructor(private router: Router) {}

  irAlHospital() {
    this.router.navigate(['/hospital']);
  }

  irAlGestor() {
    this.router.navigate(['/gestor-casos']);
  }
}
