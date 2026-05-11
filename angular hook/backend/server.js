const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: 'localhost',
    port: 5434,
    database: 'seguro_db',
    user: 'seguro_user',
    password: 'seguro_pass',
});

app.get('/veredicto/:id', async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM admission_events WHERE id = $1',
        [req.params.id]
    );
    res.json({ data: result.rows[0] || null });
});

app.listen(3000, () => console.log('Backend corriendo en puerto 3000'));