import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DatosAsegurado } from '../../interfaces/datos-asegurado'
@Component({
  selector: 'app-datos-asegurado-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './datos-asegurado-form.component.html',
  styleUrls: ['./datos-asegurado-form.component.scss'],
})
export class DatosAseguradoFormComponent implements OnInit {
  form!: FormGroup;

  hospitales = [
    { id: 'H001', nombre: 'Hospital Eugenio Espejo' },
    { id: 'H002', nombre: 'Hospital Enrique Garcés' },
    { id: 'H003', nombre: 'Hospital Pablo Arturo Suárez' },
    { id: 'H004', nombre: 'Hospital Metropolitano' },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      cedula: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(13)]],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      motivo_ingreso: ['', [Validators.required, Validators.minLength(10)]],
      id_hospital: ['', Validators.required],
      creado_en: [new Date().toISOString().slice(0, 16), Validators.required],
    });
  }

  get f() {
    return this.form.controls;
  }

  isInvalid(campo: string): boolean {
    const ctrl = this.form.get(campo);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const datos: DatosAsegurado = this.form.getRawValue();
    console.log('Datos enviados:', datos);
    // TODO: conectar con el servicio correspondiente
  }

  onCancelar(): void {
    this.form.reset({
      creado_en: new Date().toISOString().slice(0, 16),
    });
  }
}