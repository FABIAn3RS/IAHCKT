# Sistema de Verificación de Pólizas en Emergencias Hospitalarias

## ¿Qué hace este sistema?

Cuando un paciente ingresa a urgencias, el hospital dispara un webhook que activa un agente de IA. Este agente consulta automáticamente dos bases de datos — la del hospital y la de la aseguradora — calcula la cobertura aplicable y notifica simultáneamente al hospital y al gestor de casos del seguro con el veredicto.

---

## Arquitectura general

```
Frontend Hospital (Angular)
        ↓ POST
    n8n Webhook
        ↓
   ┌────┴────┐
DB Hospital  DB Seguro       ← consultas en paralelo
(pre-exist.)  (póliza)
   └────┬────┘
        ↓
    Agente IA (Gemini)
        ↓
   ┌────┴────────────────┐
Guarda en DB Seguro    POST al backend Python
(admission_events)          ↓
                     Frontend muestra veredicto
```

---

## Componentes del sistema

### 1. Frontend — Angular (`http://localhost:4200`)

Es la interfaz del hospital. Tiene un componente `Hook` que hace dos cosas:

**Enviar datos al webhook:**
```
POST http://localhost:5678/webhook-test/comprobacion
```

Body que envía:
```json
{
  "cedula": "0912345678",
  "nombre": "John Doe",
  "motivo_ingreso": "Consulta médica",
  "hospitalid": "HOSP123",
  "timestamp": "2026-05-10T..."
}
```

**Recibir el veredicto:**
El componente hace polling cada 3 segundos al backend Python:
```
GET http://localhost:3000/veredicto/ultimo
```
Cuando detecta un `id` nuevo, muestra el resultado en pantalla.

---

### 2. n8n — Servidor de automatización (`http://localhost:5678`)

Orquesta todo el flujo. Los nodos en orden son:

| Nodo | Tipo | Qué hace |
|------|------|----------|
| Webhook | Trigger | Recibe el POST del hospital |
| Code in JavaScript | Code | Extrae la cédula para consultar hospital-db |
| Code in JavaScript1 | Code | Extrae la cédula para consultar seguro-db |
| DBHOSPITAL | Postgres | Consulta pre-existencias del paciente |
| DBSEGURO | Postgres | Consulta póliza y plan del asegurado |
| Merge | Merge | Espera que ambas consultas terminen |
| Message a model | Gemini | Analiza los datos y genera el veredicto |
| Code in JavaScript2 | Code | Parsea el JSON que devuelve Gemini |
| Execute a SQL query | Postgres | Guarda el veredicto en `admission_events` |
| HTTP Request | HTTP | Notifica al backend Python con el veredicto |

---

### 3. Base de datos del hospital — `hospital_db` (puerto 5433)

Contiene el historial médico de los pacientes.

**Tablas:**
- `patients` — datos del paciente (cédula, nombre, fecha de nacimiento)
- `preexisting_conditions` — condiciones previas al seguro (código CIE-10, severidad, fecha de diagnóstico)

**Consulta que ejecuta n8n:**
```sql
SELECT pc.codigo_cie10, pc.descripcion, pc.severidad, pc.activa, pc.fecha_dx
FROM preexisting_conditions pc
JOIN patients pt ON pt.id = pc.patient_id
WHERE pt.cedula = '...'
AND pc.activa = TRUE
```

---

### 4. Base de datos del seguro — `seguro_db` (puerto 5434)

Contiene las pólizas y registra los eventos de admisión.

**Tablas:**
- `plans` — planes disponibles (Basic, Silver, Gold Plus, Platinum)
- `insured` — asegurados registrados
- `policies` — pólizas activas con fechas, límites y consumo anual
- `coverage_exceptions` — coberturas reducidas por pre-existencias declaradas al contratar
- `admission_events` — registro de cada admisión procesada por el sistema

**Consulta que ejecuta n8n:**
```sql
SELECT p.policy_number, p.estado, p.fecha_fin,
       pl.nombre as plan, pl.cobertura_pct,
       pl.limite_anual, p.consumido_anual
FROM policies p
JOIN insured i ON i.id = p.insured_id
JOIN plans pl ON pl.id = p.plan_id
WHERE i.cedula = '...'
```

---

### 5. Agente IA — Gemini

Recibe los datos de ambas DBs y el motivo de ingreso. Analiza:
- Si la póliza está vigente y tiene saldo disponible
- Si el motivo de ingreso se relaciona con alguna pre-existencia
- Qué porcentaje de cobertura aplica realmente

Devuelve siempre este JSON:
```json
{
  "decision": "aprobado | aprobado_con_alerta | rechazado",
  "poliza_vigente": true,
  "cobertura_pct": 80.0,
  "alerta": null,
  "mensaje_hospital": "Texto para el equipo de admisiones",
  "mensaje_gestor": "Texto para el gestor de casos del seguro"
}
```

---

### 6. Backend Python — FastAPI (`http://localhost:3000`)

Servidor intermediario entre n8n y Angular. No tiene lógica de negocio, solo persiste y sirve el veredicto.

**Endpoints:**

`POST /veredicto` — n8n llama aquí cuando termina el flujo
```json
{
  "cedula": "0912345678",
  "motivo_ingreso": "Consulta médica",
  "hospital": "HOSP123",
  "decision": "aprobado",
  "poliza_vigente": true,
  "cobertura_pct": 80.0,
  "alerta": null,
  "mensaje_hospital": "...",
  "mensaje_gestor": "..."
}
```

`GET /veredicto/ultimo` — Angular llama aquí cada 3 segundos
```json
{
  "data": {
    "id": 9,
    "cedula": "0912345678",
    "decision": "aprobado",
    "cobertura_pct": 80.0,
    "mensaje_hospital": "...",
    "created_at": "2026-05-10T04:08:25Z"
  }
}
```

---

## Datos de prueba disponibles

| Cédula | Nombre | Escenario |
|--------|--------|-----------|
| 0912345678 | Carlos Mendoza | Póliza Gold Plus vigente + pre-existencias cardíacas y diabetes |
| 0987654321 | Ana Paredes | Póliza vencida desde enero 2025 |
| 1712345678 | Luis Romero | Póliza Basic con límite anual agotado |
| 0923456789 | María Gutiérrez | Póliza Platinum sin problemas |

---

## Cómo levantar el sistema localmente

```bash
# 1. Bases de datos
docker compose -f docker-compose.hospital.yml up -d
docker compose -f docker-compose.seguro.yml up -d

# 2. n8n
docker compose -f docker-compose.n8n.yml up -d
# Importar workflow.json en http://localhost:5678

# 3. Backend Python
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 3000

# 4. Frontend Angular
cd frontend
npm install
ng serve
```

---

## Notas para el equipo

- El campo `cedula` es la llave que conecta todo — debe viajar en el body del webhook
- El backend Python debe correr con `--host 0.0.0.0` para que Docker pueda alcanzarlo
- n8n usa `host.docker.internal:3000` para llamar al backend porque corre dentro de Docker
- El polling en Angular compara el `id` del último registro — si el id no cambia, no actualiza la vista
- Los mensajes de Gemini pueden contener comillas simples; el INSERT usa parámetros `$1, $2...` para evitar errores SQL
