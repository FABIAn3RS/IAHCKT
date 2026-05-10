from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import psycopg2
import psycopg2.extras
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     int(os.getenv("DB_PORT", 5434)),
    "dbname":   os.getenv("DB_NAME", "seguro_db"),
    "user":     os.getenv("DB_USER", "seguro_user"),
    "password": os.getenv("DB_PASS", "seguro_pass"),
}

def get_conn():
    return psycopg2.connect(**DB_CONFIG)


class Veredicto(BaseModel):
    cedula:           str
    motivo_ingreso:   str
    hospital:         Optional[str] = None
    decision:         str
    poliza_vigente:   Optional[bool] = None
    cobertura_pct:    Optional[float] = None
    alerta:           Optional[str] = None
    mensaje_hospital: Optional[str] = None
    mensaje_gestor:   Optional[str] = None


@app.post("/veredicto", status_code=201)
def guardar_veredicto(v: Veredicto):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO admission_events
            (cedula, motivo_ingreso, hospital, decision, poliza_vigente,
             cobertura_pct, alerta, mensaje_hospital, mensaje_gestor)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        v.cedula, v.motivo_ingreso, v.hospital, v.decision,
        v.poliza_vigente, v.cobertura_pct, v.alerta,
        v.mensaje_hospital, v.mensaje_gestor
    ))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}


@app.get("/veredicto/ultimo")
def ultimo_veredicto():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT * FROM admission_events
        ORDER BY created_at DESC
        LIMIT 1
    """)
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row is None:
        return {"data": None}
    return {"data": dict(row)}
