import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegistroAseguradoPage } from './pages/registro-asegurado/registro-asegurado.page';
import { Seguro } from './components/seguro/seguro';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
  },
  {
    path: 'hospital',
    component: RegistroAseguradoPage,
  },
  {
    path: 'gestor-casos',
    component: Seguro,
  },
  {
    path: '**',
    redirectTo: ''
  }
];
