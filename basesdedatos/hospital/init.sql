-- ============================================================
-- Hospital DB — tablas de pacientes y pre-existencias
-- ============================================================

CREATE TABLE IF NOT EXISTS patients (
    id            SERIAL PRIMARY KEY,
    cedula        VARCHAR(13)  NOT NULL UNIQUE,
    nombre        VARCHAR(120) NOT NULL,
    fecha_nac     DATE         NOT NULL,
    sexo          CHAR(1)      CHECK (sexo IN ('M','F','O')),
    telefono      VARCHAR(15),
    email         VARCHAR(120),
    created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS preexisting_conditions (
    id              SERIAL PRIMARY KEY,
    patient_id      INT          NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    codigo_cie10    VARCHAR(10)  NOT NULL,
    descripcion     VARCHAR(200) NOT NULL,
    fecha_dx        DATE         NOT NULL,
    severidad       VARCHAR(20)  CHECK (severidad IN ('leve','moderada','severa')),
    activa          BOOLEAN      DEFAULT TRUE,
    notas           TEXT,
    created_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_preex_patient  ON preexisting_conditions(patient_id);
CREATE INDEX idx_preex_cie10    ON preexisting_conditions(codigo_cie10);
CREATE INDEX idx_patients_cedula ON patients(cedula);

-- ============================================================
-- Datos de prueba
-- ============================================================

INSERT INTO patients (cedula, nombre, fecha_nac, sexo, telefono, email) VALUES
    ('0912345678', 'Carlos Mendoza',   '1975-03-12', 'M', '0991234567', 'cmendoza@email.com'),
    ('0987654321', 'Ana Paredes',      '1988-07-24', 'F', '0997654321', 'aparedes@email.com'),
    ('1712345678', 'Luis Romero',      '1965-11-05', 'M', '0981122334', 'lromero@email.com'),
    ('0923456789', 'María Gutiérrez',  '1992-02-18', 'F', '0994455667', 'mgutierrez@email.com');

INSERT INTO preexisting_conditions (patient_id, codigo_cie10, descripcion, fecha_dx, severidad, activa, notas) VALUES
    (1, 'I25.1', 'Enfermedad arterial coronaria',          '2021-03-15', 'moderada', TRUE,  'Stent colocado en 2021, control anual'),
    (1, 'E11.9', 'Diabetes mellitus tipo 2',               '2019-06-20', 'leve',     TRUE,  'Controlada con metformina 850mg'),
    (2, 'J45.9', 'Asma no especificada',                   '2010-09-10', 'leve',     TRUE,  'Uso de broncodilatador de rescate'),
    (3, 'I10',   'Hipertensión esencial (primaria)',        '2015-01-08', 'moderada', TRUE,  'Enalapril 10mg diario'),
    (3, 'M16.1', 'Coxartrosis primaria unilateral',        '2020-04-22', 'moderada', TRUE,  'Candidato a reemplazo de cadera'),
    (3, 'E78.5', 'Hiperlipidemia no especificada',         '2018-11-30', 'leve',     TRUE,  'Atorvastatina 20mg'),
    (4, 'K21.0', 'Enfermedad por reflujo gastroesofágico', '2022-05-14', 'leve',     TRUE,  'Omeprazol 20mg en ayunas');
