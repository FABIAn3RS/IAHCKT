const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a base de datos de seguros
const poolSeguro = new Pool({
    host: 'localhost',
    port: 5434,
    database: 'seguro_db',
    user: 'seguro_user',
    password: 'seguro_pass',
});

// Conexión a base de datos del hospital
const poolHospital = new Pool({
    host: 'localhost',
    port: 5435,
    database: 'hospital_db',
    user: 'hospital_user',
    password: 'hospital_pass',
});

// ============================================================
// ENDPOINTS ORIGINALES
// ============================================================

app.get('/veredicto/:id', async (req, res) => {
    try {
        const result = await poolSeguro.query(
            'SELECT * FROM admission_events WHERE id = $1',
            [req.params.id]
        );
        res.json({ data: result.rows[0] || null });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener veredicto' });
    }
});

app.get('/veredicto/ultimo', async (req, res) => {
    try {
        const result = await poolSeguro.query(
            'SELECT * FROM admission_events ORDER BY created_at DESC LIMIT 1'
        );
        res.json({ data: result.rows[0] || null });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener último veredicto' });
    }
});

// ============================================================
// NUEVOS ENDPOINTS PARA GESTOR DE CASOS
// ============================================================

app.get('/admission-events', async (req, res) => {
    try {
        const result = await poolSeguro.query(
            'SELECT * FROM admission_events ORDER BY created_at DESC'
        );
        res.json({ data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener eventos de admisión' });
    }
});

app.get('/paciente/:cedula', async (req, res) => {
    try {
        const { cedula } = req.params;
        
        const pacienteResult = await poolHospital.query(
            'SELECT * FROM patients WHERE cedula = $1',
            [cedula]
        );

        if (pacienteResult.rows.length === 0) {
            return res.json({ data: null });
        }

        const paciente = pacienteResult.rows[0];

        const preexistenciasResult = await poolHospital.query(
            'SELECT * FROM preexisting_conditions WHERE patient_id = $1 AND activa = true',
            [paciente.id]
        );

        const detallesPaciente = {
            cedula: paciente.cedula,
            nombre: paciente.nombre,
            fecha_nac: paciente.fecha_nac,
            email: paciente.email,
            telefono: paciente.telefono,
            preexistencias: preexistenciasResult.rows
        };

        res.json({ data: detallesPaciente });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener detalles del paciente' });
    }
});

app.get('/poliza/:cedula', async (req, res) => {
    try {
        const { cedula } = req.params;

        const insuredResult = await poolSeguro.query(
            'SELECT id FROM insured WHERE cedula = $1',
            [cedula]
        );

        if (insuredResult.rows.length === 0) {
            return res.json({ data: null });
        }

        const insuredId = insuredResult.rows[0].id;

        const policyResult = await poolSeguro.query(
            `SELECT p.*, pl.nombre as plan, pl.cobertura_pct, pl.limite_anual
             FROM policies p
             JOIN plans pl ON p.plan_id = pl.id
             WHERE p.insured_id = $1 AND p.estado = 'vigente'
             ORDER BY p.fecha_fin DESC
             LIMIT 1`,
            [insuredId]
        );

        if (policyResult.rows.length === 0) {
            return res.json({ data: null });
        }

        const poliza = policyResult.rows[0];

        const detallesPoliza = {
            policy_number: poliza.policy_number,
            plan: poliza.plan,
            cobertura_pct: poliza.cobertura_pct,
            limite_anual: poliza.limite_anual,
            consumido_anual: poliza.consumido_anual,
            fecha_inicio: poliza.fecha_inicio,
            fecha_fin: poliza.fecha_fin,
            estado: poliza.estado
        };

        res.json({ data: detallesPoliza });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener detalles de póliza' });
    }
});

app.get('/historial-ingresos/:cedula', async (req, res) => {
    try {
        const { cedula } = req.params;

        const result = await poolSeguro.query(
            `SELECT 
                created_at as fecha, 
                motivo_ingreso as motivo, 
                decision as resultado
             FROM admission_events 
             WHERE cedula = $1
             ORDER BY created_at DESC
             LIMIT 10`,
            [cedula]
        );

        res.json({ data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener historial de ingresos' });
    }
});

app.get('/razonamiento-ia/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await poolSeguro.query(
            'SELECT * FROM admission_events WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.json({ data: { razonamiento: 'No hay análisis disponible' } });
        }

        const evento = result.rows[0];

        let razonamiento = `ANÁLISIS AUTOMÁTICO DE SOLICITUD #${id}\n`;
        razonamiento += `═══════════════════════════════════════\n\n`;
        
        razonamiento += `📋 DATOS DEL CASO:\n`;
        razonamiento += `• Cédula: ${evento.cedula}\n`;
        razonamiento += `• Motivo: ${evento.motivo_ingreso}\n`;
        razonamiento += `• Hospital: ${evento.hospital}\n`;
        razonamiento += `• Fecha: ${new Date(evento.created_at).toLocaleString('es-ES')}\n\n`;

        razonamiento += `🛡️ ESTADO DE LA PÓLIZA:\n`;
        if (evento.poliza_vigente) {
            razonamiento += `✓ Póliza vigente y válida\n`;
            razonamiento += `• Cobertura: ${evento.cobertura_pct}%\n`;
        } else {
            razonamiento += `✗ Póliza NO vigente\n`;
        }
        razonamiento += `\n`;

        razonamiento += `🔍 ANÁLISIS:\n`;
        if (!evento.poliza_vigente) {
            razonamiento += `El agente RECHAZÓ porque: La póliza no está vigente.\n`;
        } else {
            razonamiento += `El agente AUTORIZÓ porque:\n`;
            razonamiento += `  - El diagnóstico está dentro de la cobertura del plan\n`;
            razonamiento += `  - La cobertura es del ${evento.cobertura_pct}%\n`;
            razonamiento += `  - La póliza está activa y válida\n`;
        }
        razonamiento += `\n`;

        if (evento.alerta) {
            razonamiento += `⚠️ ALERTAS:\n`;
            razonamiento += `${evento.alerta}\n\n`;
        }

        razonamiento += `📊 DECISIÓN PRELIMINAR: ${evento.decision}\n`;

        res.json({ data: { razonamiento } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener razonamiento de IA' });
    }
});

app.post('/actualizar-decision', async (req, res) => {
    try {
        const { id, decision, mensaje_gestor } = req.body;

        const result = await poolSeguro.query(
            `UPDATE admission_events 
             SET decision = $1, mensaje_gestor = $2, updated_at = NOW()
             WHERE id = $3
             RETURNING *`,
            [decision, mensaje_gestor, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        res.json({ 
            data: result.rows[0],
            message: 'Decisión actualizada correctamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar decisión' });
    }
});

// ============================================================
// SERVIDOR
// ============================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✓ Backend corriendo en puerto ${PORT}`);
    console.log(`✓ Base de datos de seguros: localhost:5434/seguro_db`);
    console.log(`✓ Base de datos del hospital: localhost:5435/hospital_db`);
});

module.exports = app;
