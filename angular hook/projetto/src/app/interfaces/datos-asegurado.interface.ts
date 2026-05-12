async enviarDatos(datos: DatosAsegurado): Promise<void> {
  this.limpiarIntervalo();
  this.cargando.set(true);
  this.veredicto.set(null);

  const payload = {
    cedula: datos.cedula,
    nombre: datos.nombre,
    motivo_ingreso: datos.motivo_ingreso,
    hospitalid: datos.id_hospital,
    timestamp: new Date().toISOString()
  };

  try {
    const result = await firstValueFrom(
      this.http.post<{ id: number }>(this.webhookUrl, payload)
    );
    console.log('Enviado a n8n:', result);
    // resto del código...
