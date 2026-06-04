-- ============================================================
--  BASE DE DATOS: Sistema Generador de Portafolios Digitales

-- ============================================================

-- ============================================================
-- 1. rol
-- ============================================================
CREATE TABLE rol (
  id_rol      SERIAL       PRIMARY KEY,
  nombre      VARCHAR(30)  NOT NULL UNIQUE,
  descripcion VARCHAR(200)
);

-- ============================================================
-- 2. imagen
-- ============================================================
CREATE TABLE imagen (
  id_imagen    SERIAL       PRIMARY KEY,
  ruta         VARCHAR(300) NOT NULL,
  nombre       VARCHAR(150),
  tipo         VARCHAR(20),
  tamanio_kb   INT,
  contexto     VARCHAR(20)  NOT NULL DEFAULT 'perfil'
                             CHECK (contexto IN ('perfil','proyecto')),
  fecha_subida TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. usuario
-- ============================================================
CREATE TABLE usuario (
  id_usuario     SERIAL       PRIMARY KEY,
  nombre         VARCHAR(80)  NOT NULL,
  apellido       VARCHAR(80)  NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  profesion      VARCHAR(120),
  titulo_profesional VARCHAR(150),
  biografia      TEXT,
  id_imagen      INT REFERENCES imagen(id_imagen) ON DELETE SET NULL,
  nombre_modificado BOOLEAN   NOT NULL DEFAULT FALSE,
  id_imagen_ci   INT REFERENCES imagen(id_imagen) ON DELETE SET NULL,
  ci_estado      VARCHAR(50)  DEFAULT NULL,
  linkedin_url   VARCHAR(300),
  github_url     VARCHAR(300),
  telefono       VARCHAR(50),
  redes_sociales JSONB        DEFAULT '[]'::jsonb,
  visibilidad    VARCHAR(20)  NOT NULL DEFAULT 'publico' CHECK (visibilidad IN ('publico','privado')),
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  fecha_registro TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3.1 oauth_account  (soporte GitHub OAuth)
-- ============================================================
CREATE TABLE oauth_account (
  id_oauth         SERIAL       PRIMARY KEY,
  id_usuario       INT          NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  provider         VARCHAR(30)  NOT NULL,
  provider_user_id VARCHAR(100) NOT NULL,
  access_token     TEXT,
  refresh_token    TEXT,
  created_at       TIMESTAMP    DEFAULT NOW(),
  UNIQUE (provider, provider_user_id)
);

-- ============================================================
-- 3.2 experiencia (laboral y académica)
-- ============================================================
CREATE TABLE experiencia (
  id_experiencia SERIAL PRIMARY KEY,
  id_usuario     INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  tipo           VARCHAR(20) NOT NULL CHECK (tipo IN ('laboral','academica')),
  institucion_empresa VARCHAR(150) NOT NULL,
  cargo_titulo   VARCHAR(150) NOT NULL,
  fecha_inicio   DATE NOT NULL,
  fecha_fin      DATE,
  descripcion    TEXT,
  fecha_registro TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. rol_usuario  (tabla pivote)
-- ============================================================
CREATE TABLE rol_usuario (
  id_rol     INT NOT NULL REFERENCES rol(id_rol)         ON DELETE CASCADE,
  id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  PRIMARY KEY (id_rol, id_usuario)
);

-- ============================================================
-- 5. habilidad  (catálogo maestro)
-- ============================================================
CREATE TABLE habilidad (
  id_habilidad SERIAL       PRIMARY KEY,
  nombre       VARCHAR(80)  NOT NULL UNIQUE,
  tipo         VARCHAR(10)  NOT NULL CHECK (tipo IN ('tecnica','blanda')),
  categoria    VARCHAR(50),
  descripcion  TEXT
);

-- ============================================================
-- 6. usuario_habilidad
-- ============================================================
CREATE TABLE usuario_habilidad (
  id_usuario   INT      NOT NULL REFERENCES usuario(id_usuario)   ON DELETE CASCADE,
  id_habilidad INT      NOT NULL REFERENCES habilidad(id_habilidad) ON DELETE CASCADE,
  nivel        SMALLINT CHECK (nivel IS NULL OR (nivel BETWEEN 0 AND 100)),
  descripcion  TEXT,
  PRIMARY KEY (id_usuario, id_habilidad)
);

-- ============================================================
-- 7. proyecto
-- ============================================================
CREATE TABLE proyecto (
  id_proyecto        SERIAL       PRIMARY KEY,
  id_usuario         INT          NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  nombre             VARCHAR(150) NOT NULL,
  descripcion        TEXT,
  url_repositorio    VARCHAR(300),
  fecha_creacion     TIMESTAMP    NOT NULL DEFAULT NOW(),
  estado             VARCHAR(20)  NOT NULL DEFAULT 'en_desarrollo'
                      CHECK (estado IN ('planificado','en_desarrollo','completado','pausado')),
  visible_portafolio BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ============================================================
-- 8. proyecto_imagen
-- ============================================================
CREATE TABLE proyecto_imagen (
  id_proyecto  INT     NOT NULL REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
  id_imagen    INT     NOT NULL REFERENCES imagen(id_imagen)     ON DELETE CASCADE,
  orden        SMALLINT NOT NULL DEFAULT 1 CHECK (orden BETWEEN 1 AND 6),
  PRIMARY KEY (id_proyecto, id_imagen)
);

-- ============================================================
-- 9. proyecto_habilidad
-- ============================================================
CREATE TABLE proyecto_habilidad (
  id_proyecto  INT NOT NULL REFERENCES proyecto(id_proyecto)   ON DELETE CASCADE,
  id_habilidad INT NOT NULL REFERENCES habilidad(id_habilidad) ON DELETE CASCADE,
  PRIMARY KEY (id_proyecto, id_habilidad)
);

-- ============================================================
-- 10. personal_access_tokens  (Laravel Sanctum)
-- ============================================================
CREATE TABLE personal_access_tokens (
  id             BIGSERIAL    PRIMARY KEY,
  tokenable_type VARCHAR(255) NOT NULL,
  tokenable_id   BIGINT       NOT NULL,
  name           VARCHAR(255) NOT NULL,
  token          VARCHAR(64)  NOT NULL UNIQUE,
  abilities      TEXT,
  last_used_at   TIMESTAMP,
  expires_at     TIMESTAMP,
  created_at     TIMESTAMP,
  updated_at     TIMESTAMP
);

-- ============================================================
-- TABLAS DE AUDITORÍA
-- ============================================================

CREATE TABLE bitacora_usuario (
  id_bitacora       SERIAL       PRIMARY KEY,
  id_usuario_accion INT,
  accion            VARCHAR(10)  CHECK (accion IN ('INSERT','UPDATE','DELETE')),
  descripcion       VARCHAR(255),
  valor_anterior    JSONB,
  valor_nuevo       JSONB,
  fecha             DATE         DEFAULT CURRENT_DATE,
  hora              TIME         DEFAULT CURRENT_TIME
);

CREATE TABLE bitacora_proyecto (
  id_bitacora       SERIAL       PRIMARY KEY,
  id_usuario_accion INT,
  accion            VARCHAR(10)  CHECK (accion IN ('INSERT','UPDATE','DELETE')),
  descripcion       VARCHAR(255),
  valor_anterior    JSONB,
  valor_nuevo       JSONB,
  fecha             DATE         DEFAULT CURRENT_DATE,
  hora              TIME         DEFAULT CURRENT_TIME
);

CREATE TABLE bitacora_usuario_habilidad (
  id_bitacora       SERIAL       PRIMARY KEY,
  id_usuario_accion INT,
  accion            VARCHAR(10)  CHECK (accion IN ('INSERT','UPDATE','DELETE')),
  descripcion       VARCHAR(255),
  valor_anterior    JSONB,
  valor_nuevo       JSONB,
  fecha             DATE         DEFAULT CURRENT_DATE,
  hora              TIME         DEFAULT CURRENT_TIME
);

CREATE TABLE bitacora_rol_usuario (
  id_bitacora       SERIAL       PRIMARY KEY,
  id_usuario_accion INT,
  accion            VARCHAR(10)  CHECK (accion IN ('INSERT','UPDATE','DELETE')),
  descripcion       VARCHAR(255),
  valor_anterior    JSONB,
  valor_nuevo       JSONB,
  fecha             DATE         DEFAULT CURRENT_DATE,
  hora              TIME         DEFAULT CURRENT_TIME
);

-- ============================================================
-- FUNCIÓN AUXILIAR: obtener usuario de sesión
-- ============================================================

CREATE OR REPLACE FUNCTION fn_usuario_sesion()
RETURNS INT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.usuario_actual', TRUE), '')::INT;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS DE AUDITORÍA
-- ============================================================

-- TRIGGER: usuario
CREATE OR REPLACE FUNCTION fn_audit_usuario()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO bitacora_usuario (id_usuario_accion, accion, descripcion, valor_anterior, valor_nuevo)
    VALUES (
      fn_usuario_sesion(), 'INSERT',
      'Nuevo usuario: ' || NEW.email,
      NULL,
      jsonb_build_object('id_usuario', NEW.id_usuario, 'nombre', NEW.nombre,
                         'apellido', NEW.apellido, 'email', NEW.email,
                         'profesion', NEW.profesion, 'activo', NEW.activo)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO bitacora_usuario (id_usuario_accion, accion, descripcion, valor_anterior, valor_nuevo)
    VALUES (
      fn_usuario_sesion(), 'UPDATE',
      'Actualización usuario id=' || OLD.id_usuario,
      jsonb_build_object('nombre', OLD.nombre, 'apellido', OLD.apellido,
                         'email', OLD.email, 'profesion', OLD.profesion,
                         'biografia', OLD.biografia, 'activo', OLD.activo),
      jsonb_build_object('nombre', NEW.nombre, 'apellido', NEW.apellido,
                         'email', NEW.email, 'profesion', NEW.profesion,
                         'biografia', NEW.biografia, 'activo', NEW.activo)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO bitacora_usuario (id_usuario_accion, accion, descripcion, valor_anterior, valor_nuevo)
    VALUES (
      fn_usuario_sesion(), 'DELETE',
      'Usuario eliminado: ' || OLD.email,
      jsonb_build_object('id_usuario', OLD.id_usuario, 'nombre', OLD.nombre,
                         'apellido', OLD.apellido, 'email', OLD.email),
      NULL
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_usuario
  AFTER INSERT OR UPDATE OR DELETE ON usuario
  FOR EACH ROW EXECUTE FUNCTION fn_audit_usuario();

-- TRIGGER: proyecto
CREATE OR REPLACE FUNCTION fn_audit_proyecto()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO bitacora_proyecto (id_usuario_accion, accion, descripcion, valor_anterior, valor_nuevo)
    VALUES (fn_usuario_sesion(), 'INSERT',
            'Proyecto creado: ' || NEW.nombre,
            NULL,
            jsonb_build_object('id_proyecto', NEW.id_proyecto, 'id_usuario', NEW.id_usuario,
                               'nombre', NEW.nombre, 'estado', NEW.estado,
                               'visible_portafolio', NEW.visible_portafolio));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO bitacora_proyecto (id_usuario_accion, accion, descripcion, valor_anterior, valor_nuevo)
    VALUES (fn_usuario_sesion(), 'UPDATE',
            'Proyecto actualizado id=' || OLD.id_proyecto,
            jsonb_build_object('nombre', OLD.nombre, 'descripcion', OLD.descripcion,
                               'url_repositorio', OLD.url_repositorio, 'estado', OLD.estado,
                               'visible_portafolio', OLD.visible_portafolio),
            jsonb_build_object('nombre', NEW.nombre, 'descripcion', NEW.descripcion,
                               'url_repositorio', NEW.url_repositorio, 'estado', NEW.estado,
                               'visible_portafolio', NEW.visible_portafolio));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO bitacora_proyecto (id_usuario_accion, accion, descripcion, valor_anterior, valor_nuevo)
    VALUES (fn_usuario_sesion(), 'DELETE',
            'Proyecto eliminado: ' || OLD.nombre,
            jsonb_build_object('id_proyecto', OLD.id_proyecto, 'id_usuario', OLD.id_usuario,
                               'nombre', OLD.nombre, 'estado', OLD.estado),
            NULL);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_proyecto
  AFTER INSERT OR UPDATE OR DELETE ON proyecto
  FOR EACH ROW EXECUTE FUNCTION fn_audit_proyecto();

-- TRIGGER: usuario_habilidad
CREATE OR REPLACE FUNCTION fn_audit_usuario_habilidad()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO bitacora_usuario_habilidad (id_usuario_accion, accion, descripcion, valor_anterior, valor_nuevo)
    VALUES (fn_usuario_sesion(), 'INSERT',
            'Habilidad id=' || NEW.id_habilidad || ' asignada a usuario=' || NEW.id_usuario,
            NULL,
            jsonb_build_object('id_usuario', NEW.id_usuario, 'id_habilidad', NEW.id_habilidad, 'nivel', NEW.nivel));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO bitacora_usuario_habilidad (id_usuario_accion, accion, descripcion, valor_anterior, valor_nuevo)
    VALUES (fn_usuario_sesion(), 'UPDATE',
            'Nivel habilidad id=' || OLD.id_habilidad || ' usuario=' || OLD.id_usuario,
            jsonb_build_object('id_usuario', OLD.id_usuario, 'id_habilidad', OLD.id_habilidad, 'nivel', OLD.nivel),
            jsonb_build_object('id_usuario', NEW.id_usuario, 'id_habilidad', NEW.id_habilidad, 'nivel', NEW.nivel));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO bitacora_usuario_habilidad (id_usuario_accion, accion, descripcion, valor_anterior, valor_nuevo)
    VALUES (fn_usuario_sesion(), 'DELETE',
            'Habilidad id=' || OLD.id_habilidad || ' removida de usuario=' || OLD.id_usuario,
            jsonb_build_object('id_usuario', OLD.id_usuario, 'id_habilidad', OLD.id_habilidad, 'nivel', OLD.nivel),
            NULL);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_usuario_habilidad
  AFTER INSERT OR UPDATE OR DELETE ON usuario_habilidad
  FOR EACH ROW EXECUTE FUNCTION fn_audit_usuario_habilidad();

-- TRIGGER: rol_usuario
CREATE OR REPLACE FUNCTION fn_audit_rol_usuario()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO bitacora_rol_usuario (id_usuario_accion, accion, descripcion, valor_anterior, valor_nuevo)
    VALUES (fn_usuario_sesion(), 'INSERT',
            'Rol id=' || NEW.id_rol || ' asignado a usuario id=' || NEW.id_usuario,
            NULL,
            jsonb_build_object('id_rol', NEW.id_rol, 'id_usuario', NEW.id_usuario));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO bitacora_rol_usuario (id_usuario_accion, accion, descripcion, valor_anterior, valor_nuevo)
    VALUES (fn_usuario_sesion(), 'DELETE',
            'Rol id=' || OLD.id_rol || ' revocado de usuario id=' || OLD.id_usuario,
            jsonb_build_object('id_rol', OLD.id_rol, 'id_usuario', OLD.id_usuario),
            NULL);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_rol_usuario
  AFTER INSERT OR DELETE ON rol_usuario
  FOR EACH ROW EXECUTE FUNCTION fn_audit_rol_usuario();

-- ============================================================
-- VISTAS
-- ============================================================

CREATE VIEW v_portafolio_publico AS
SELECT
  u.id_usuario,
  u.nombre || ' ' || u.apellido AS nombre_completo,
  u.profesion,
  u.titulo_profesional,
  u.biografia,
  u.linkedin_url,
  u.github_url,
  u.visibilidad,
  i.ruta                         AS foto_url
FROM  usuario u
LEFT  JOIN imagen i ON i.id_imagen = u.id_imagen
WHERE u.activo = TRUE;

CREATE VIEW v_habilidades_usuario AS
SELECT
  uh.id_usuario,
  h.id_habilidad,
  h.nombre,
  h.tipo,
  h.categoria,
  uh.nivel,
  uh.descripcion
FROM  usuario_habilidad uh
JOIN  habilidad h ON h.id_habilidad = uh.id_habilidad
ORDER BY h.tipo, h.categoria NULLS LAST, h.nombre;

CREATE VIEW v_proyectos_usuario AS
SELECT
  p.id_proyecto,
  p.id_usuario,
  p.nombre,
  p.descripcion,
  p.url_repositorio,
  p.fecha_creacion,
  p.estado,
  p.visible_portafolio,
  COUNT(DISTINCT pi2.id_imagen)   AS total_imagenes,
  COUNT(DISTINCT ph.id_habilidad) AS total_habilidades
FROM  proyecto p
LEFT  JOIN proyecto_imagen    pi2 ON pi2.id_proyecto = p.id_proyecto
LEFT  JOIN proyecto_habilidad ph  ON ph.id_proyecto  = p.id_proyecto
GROUP BY p.id_proyecto;

CREATE VIEW v_estadisticas_admin AS
SELECT
  (SELECT COUNT(*) FROM usuario)                                   AS total_usuarios,
  (SELECT COUNT(*) FROM usuario WHERE activo = TRUE)               AS usuarios_activos,
  (SELECT COUNT(*) FROM proyecto)                                  AS total_proyectos,
  (SELECT COUNT(*) FROM proyecto WHERE estado = 'completado')      AS proyectos_completados,
  (SELECT COUNT(*) FROM usuario_habilidad)                         AS habilidades_registradas,
  (SELECT COUNT(*) FROM habilidad WHERE tipo = 'tecnica')          AS habilidades_tecnicas_catalogo,
  (SELECT COUNT(*) FROM habilidad WHERE tipo = 'blanda')           AS habilidades_blandas_catalogo;

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_usuario_email      ON usuario(email);
CREATE INDEX idx_usuario_activo     ON usuario(activo);
CREATE INDEX idx_rol_usuario_u      ON rol_usuario(id_usuario);
CREATE INDEX idx_proyecto_usuario   ON proyecto(id_usuario);
CREATE INDEX idx_proyecto_visible   ON proyecto(visible_portafolio);
CREATE INDEX idx_uh_usuario         ON usuario_habilidad(id_usuario);
CREATE INDEX idx_uh_habilidad       ON usuario_habilidad(id_habilidad);
CREATE INDEX idx_ph_proyecto        ON proyecto_habilidad(id_proyecto);
CREATE INDEX idx_pi_proyecto        ON proyecto_imagen(id_proyecto);
CREATE INDEX idx_habilidad_tipo     ON habilidad(tipo);

CREATE INDEX idx_bit_usu_fecha      ON bitacora_usuario(fecha);
CREATE INDEX idx_bit_usu_actor      ON bitacora_usuario(id_usuario_accion);
CREATE INDEX idx_bit_proy_fecha     ON bitacora_proyecto(fecha);
CREATE INDEX idx_bit_proy_actor     ON bitacora_proyecto(id_usuario_accion);
CREATE INDEX idx_bit_hab_fecha      ON bitacora_usuario_habilidad(fecha);
CREATE INDEX idx_bit_rol_fecha      ON bitacora_rol_usuario(fecha);

-- ============================================================
-- DATOS SEMILLA
-- ============================================================

INSERT INTO rol (nombre, descripcion) VALUES
  ('usuario',       'Usuario registrado. Crea y gestiona su propio portafolio'),
  ('administrador', 'Acceso total al sistema. Gestión global y estadísticas');

INSERT INTO habilidad (nombre, tipo, categoria) VALUES
  -- === FRONTEND ===
  ('React',          'tecnica', 'Frontend'),
  ('Vue',            'tecnica', 'Frontend'),
  ('Angular',        'tecnica', 'Frontend'),
  ('TypeScript',     'tecnica', 'Frontend'),
  ('JavaScript',     'tecnica', 'Frontend'),
  ('HTML/CSS',       'tecnica', 'Frontend'),
  ('Tailwind CSS',   'tecnica', 'Frontend'),
  ('Next.js',        'tecnica', 'Frontend'),
  ('SASS/SCSS',      'tecnica', 'Frontend'),
  -- === BACKEND ===
  ('Node',           'tecnica', 'Backend'),
  ('Java',           'tecnica', 'Backend'),
  ('Python',         'tecnica', 'Backend'),
  ('PHP',            'tecnica', 'Backend'),
  ('Spring',         'tecnica', 'Backend'),
  ('Laravel',        'tecnica', 'Backend'),
  ('Go (Golang)',    'tecnica', 'Backend'),
  ('REST APIs',      'tecnica', 'Backend'),
  -- === BASE DE DATOS ===
  ('SQL',            'tecnica', 'Base de datos'),
  ('PostgreSQL',     'tecnica', 'Base de datos'),
  ('MySQL',          'tecnica', 'Base de datos'),
  ('MongoDB',        'tecnica', 'Base de datos'),
  -- === DEVOPS / HERRAMIENTAS ===
  ('Docker',         'tecnica', 'DevOps'),
  ('Git',            'tecnica', 'DevOps'),
  ('AWS',            'tecnica', 'DevOps'),
  ('Kubernetes',     'tecnica', 'DevOps'),
  -- === BLANDAS ===
  ('Liderazgo',               'blanda', NULL),
  ('Comunicación',            'blanda', NULL),
  ('Trabajo en equipo',       'blanda', NULL),
  ('Resolución de problemas', 'blanda', NULL),
  ('Adaptabilidad',           'blanda', NULL),
  ('Creatividad',             'blanda', NULL),
  ('Empatía',                 'blanda', NULL),
  ('Puntualidad',             'blanda', NULL),
  ('Proactividad',            'blanda', NULL),
  ('Organización',            'blanda', NULL),
  ('Gestión del tiempo',      'blanda', NULL),
  ('Aprendizaje Autónomo',    'blanda', NULL),
  ('Mentoría',                'blanda', NULL);
