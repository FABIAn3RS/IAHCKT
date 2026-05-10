-- ============================================================
-- Seguro DB — tablas de asegurados, planes y pólizas
-- ============================================================

CREATE TABLE IF NOT EXISTS plans (
    id                  SERIAL PRIMARY KEY,
    nombre              VARCHAR(60)    NOT NULL,
    cobertura_pct       NUMERIC(5,2)   NOT NULL,
    limite_anual        NUMERIC(12,2)  NOT NULL,
    deducible           NUMERIC(10,2)  NOT NULL,
    cubre_preexistencias BOOLEAN       DEFAULT FALSE,
    descripcion         TEXT
);

CREATE TABLE IF NOT EXISTS insured (
    id              SERIAL PRIMARY KEY,
    cedula          VARCHAR(13)  NOT NULL UNIQUE,
    nombre          VARCHAR(120) NOT NULL,
    fecha_nac       DATE         NOT NULL,
    email           VARCHAR(120),
    telefono        VARCHAR(15),
    created_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policies (
    id                  SERIAL PRIMARY KEY,
    policy_number       VARCHAR(20)   NOT NULL UNIQUE,
    insured_id          INT           NOT NULL REFERENCES insured(id),
    plan_id             INT           NOT NULL REFERENCES plans(id),
    fecha_inicio        DATE          NOT NULL,
    fecha_fin           DATE          NOT NULL,
    estado              VARCHAR(20)   NOT NULL CHECK (estado IN ('vigente','vencida','suspendida','cancelada')),
    consumido_anual     NUMERIC(12,2) DEFAULT 0,
    gestor_casos_email  VARCHAR(120),
    created_at          TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coverage_exceptions (
    id              SERIAL PRIMARY KEY,
    policy_id       INT          NOT NULL REFERENCES policies(id),
    codigo_cie10    VARCHAR(10)  NOT NULL,
    motivo          VARCHAR(200),
    cobertura_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admission_events (
    id               SERIAL PRIMARY KEY,
    cedula           VARCHAR(13)   NOT NULL,
    motivo_ingreso   VARCHAR(200)  NOT NULL,
    hospital         VARCHAR(120),
    decision         VARCHAR(30)   NOT NULL,
    poliza_vigente   BOOLEAN,
    cobertura_pct    NUMERIC(5,2),
    alerta           TEXT,
    mensaje_hospital TEXT,
    mensaje_gestor   TEXT,
    created_at       TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX idx_admission_cedula    ON admission_events(cedula);
CREATE INDEX idx_admission_created   ON admission_events(created_at DESC);
CREATE INDEX idx_policies_insured     ON policies(insured_id);
CREATE INDEX idx_policies_number      ON policies(policy_number);
CREATE INDEX idx_insured_cedula       ON insured(cedula);
CREATE INDEX idx_exceptions_policy    ON coverage_exceptions(policy_id);
CREATE INDEX idx_exceptions_cie10     ON coverage_exceptions(codigo_cie10);

-- ============================================================
-- Datos de prueba
-- ============================================================

INSERT INTO plans (nombre, cobertura_pct, limite_anual, deducible, cubre_preexistencias, descripcion) VALUES
    ('Basic',     60.00,  15000.00, 500.00, FALSE, 'Plan básico sin cobertura de pre-existencias'),
    ('Silver',    70.00,  30000.00, 400.00, FALSE, 'Plan intermedio'),
    ('Gold Plus', 80.00,  60000.00, 300.00, TRUE,  'Plan premium con cobertura parcial de pre-existencias'),
    ('Platinum',  95.00, 120000.00, 100.00, TRUE,  'Cobertura total incluyendo pre-existencias');

INSERT INTO insured (cedula, nombre, fecha_nac, email, telefono) VALUES
    ('0912345678', 'Carlos Mendoza',   '1975-03-12', 'cmendoza@email.com',   '0991234567'),
    ('0987654321', 'Ana Paredes',      '1988-07-24', 'aparedes@email.com',   '0997654321'),
    ('1712345678', 'Luis Romero',      '1965-11-05', 'lromero@email.com',    '0981122334'),
    ('0923456789', 'María Gutiérrez',  '1992-02-18', 'mgutierrez@email.com', '0994455667');

INSERT INTO policies (policy_number, insured_id, plan_id, fecha_inicio, fecha_fin, estado, consumido_anual, gestor_casos_email) VALUES
    ('POL-2024-00341', 1, 3, '2024-01-01', '2026-12-31', 'vigente',   14800.00, 'gestor1@seguro.com'),
    ('POL-2023-00812', 2, 2, '2023-06-01', '2025-01-15', 'vencida',       0.00, 'gestor2@seguro.com'),
    ('POL-2024-01105', 3, 1, '2024-03-01', '2026-02-28', 'vigente',   15000.00, 'gestor3@seguro.com'),
    ('POL-2025-00044', 4, 4, '2025-01-01', '2026-12-31', 'vigente',    3200.00, 'gestor1@seguro.com');

-- Carlos tiene pre-existencia cardíaca: cobertura reducida al 70% para códigos cardíacos
INSERT INTO coverage_exceptions (policy_id, codigo_cie10, motivo, cobertura_pct) VALUES
    (1, 'I25.1', 'Pre-existencia declarada al contratar', 70.00),
    (1, 'E11.9', 'Pre-existencia declarada al contratar', 70.00);

-- Luis alcanzó su límite anual (Basic $15,000 consumidos)
-- La columna consumido_anual ya refleja esto en el INSERT de policies
