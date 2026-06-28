-- Normalizacion AidSoft / PortaGen v2
-- PostgreSQL
--
-- Objetivo:
-- - Crear estructura normalizada en español sin romper la estructura legacy actual.
-- - Migrar datos existentes hacia tablas logicas nuevas.
-- - Mantener Laravel/Sanctum estable: NO se renombran migrations ni personal_access_tokens.
--
-- Importante:
-- - Este script es aditivo e idempotente en lo posible.
-- - No elimina tablas antiguas.
-- - Ejecutar primero en respaldo/copia de BD.

BEGIN;

-- ============================================================
-- 1. Catalogos
-- ============================================================

CREATE TABLE IF NOT EXISTS public.visibilidad_perfil (
    id_visibilidad SERIAL PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(80) NOT NULL
);

INSERT INTO public.visibilidad_perfil (codigo, nombre)
VALUES
    ('publico', 'Publico'),
    ('privado', 'Privado')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

CREATE TABLE IF NOT EXISTS public.estado_verificacion (
    id_estado_verificacion SERIAL PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(80) NOT NULL
);

INSERT INTO public.estado_verificacion (codigo, nombre)
VALUES
    ('sin_solicitar', 'Sin solicitar'),
    ('pendiente', 'Pendiente de revision'),
    ('aprobado', 'Aprobado'),
    ('rechazado', 'Rechazado')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

CREATE TABLE IF NOT EXISTS public.contexto_imagen (
    id_contexto_imagen SERIAL PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(80) NOT NULL
);

INSERT INTO public.contexto_imagen (codigo, nombre)
VALUES
    ('perfil', 'Perfil'),
    ('ci', 'Cedula de identidad'),
    ('proyecto', 'Proyecto'),
    ('otro', 'Otro')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

CREATE TABLE IF NOT EXISTS public.tipo_red_social (
    id_tipo_red_social SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(80) NOT NULL
);

INSERT INTO public.tipo_red_social (codigo, nombre)
VALUES
    ('linkedin', 'LinkedIn'),
    ('github', 'GitHub'),
    ('sitio_web', 'Sitio web'),
    ('otro', 'Otro')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

CREATE TABLE IF NOT EXISTS public.tipo_habilidad (
    id_tipo_habilidad SERIAL PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(80) NOT NULL
);

INSERT INTO public.tipo_habilidad (codigo, nombre)
VALUES
    ('tecnica', 'Tecnica'),
    ('blanda', 'Blanda')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

CREATE TABLE IF NOT EXISTS public.categoria_habilidad (
    id_categoria_habilidad SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE
);

INSERT INTO public.categoria_habilidad (nombre)
SELECT DISTINCT COALESCE(NULLIF(BTRIM(categoria), ''), 'General')
FROM public.habilidad
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.nivel_academico (
    id_nivel_academico SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE
);

INSERT INTO public.nivel_academico (nombre)
SELECT DISTINCT BTRIM(nivel_academico)
FROM public.experiencia
WHERE tipo = 'academica'
  AND nivel_academico IS NOT NULL
  AND BTRIM(nivel_academico) <> ''
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.nivel_academico (nombre)
VALUES ('No especificado')
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.modulo_bitacora (
    id_modulo_bitacora SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(80) NOT NULL
);

INSERT INTO public.modulo_bitacora (codigo, nombre)
VALUES
    ('usuario', 'Usuario'),
    ('proyecto', 'Proyecto'),
    ('habilidad', 'Habilidad'),
    ('rol', 'Rol')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

CREATE TABLE IF NOT EXISTS public.accion_bitacora (
    id_accion_bitacora SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(80) NOT NULL
);

INSERT INTO public.accion_bitacora (codigo, nombre)
VALUES
    ('INSERT', 'Insercion'),
    ('UPDATE', 'Actualizacion'),
    ('DELETE', 'Eliminacion')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

-- ============================================================
-- 2. Usuario: separar credenciales, perfil y redes sociales
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cuenta_usuario (
    usuario_id INTEGER PRIMARY KEY REFERENCES public.usuario(id_usuario) ON DELETE CASCADE,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMP WITHOUT TIME ZONE
);

INSERT INTO public.cuenta_usuario (
    usuario_id,
    correo,
    contrasena_hash,
    activo,
    fecha_creacion
)
SELECT
    u.id_usuario,
    u.email,
    u.password_hash,
    u.activo,
    u.fecha_registro
FROM public.usuario u
ON CONFLICT (usuario_id) DO UPDATE SET
    correo = EXCLUDED.correo,
    contrasena_hash = EXCLUDED.contrasena_hash,
    activo = EXCLUDED.activo,
    fecha_creacion = EXCLUDED.fecha_creacion,
    fecha_actualizacion = now();

CREATE TABLE IF NOT EXISTS public.perfil_usuario (
    id_perfil SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE REFERENCES public.usuario(id_usuario) ON DELETE CASCADE,
    profesion VARCHAR(120),
    titulo_profesional VARCHAR(150),
    biografia TEXT,
    telefono VARCHAR(50),
    visibilidad_id INTEGER NOT NULL REFERENCES public.visibilidad_perfil(id_visibilidad),
    imagen_perfil_id INTEGER REFERENCES public.imagen(id_imagen) ON DELETE SET NULL,
    nombre_modificado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMP WITHOUT TIME ZONE
);

INSERT INTO public.perfil_usuario (
    usuario_id,
    profesion,
    titulo_profesional,
    biografia,
    telefono,
    visibilidad_id,
    imagen_perfil_id,
    nombre_modificado,
    fecha_creacion
)
SELECT
    u.id_usuario,
    u.profesion,
    u.titulo_profesional,
    u.biografia,
    u.telefono,
    COALESCE(v.id_visibilidad, (SELECT id_visibilidad FROM public.visibilidad_perfil WHERE codigo = 'publico')),
    u.id_imagen,
    u.nombre_modificado,
    u.fecha_registro
FROM public.usuario u
LEFT JOIN public.visibilidad_perfil v ON v.codigo = COALESCE(NULLIF(BTRIM(u.visibilidad), ''), 'publico')
ON CONFLICT (usuario_id) DO UPDATE SET
    profesion = EXCLUDED.profesion,
    titulo_profesional = EXCLUDED.titulo_profesional,
    biografia = EXCLUDED.biografia,
    telefono = EXCLUDED.telefono,
    visibilidad_id = EXCLUDED.visibilidad_id,
    imagen_perfil_id = EXCLUDED.imagen_perfil_id,
    nombre_modificado = EXCLUDED.nombre_modificado,
    fecha_actualizacion = now();

CREATE TABLE IF NOT EXISTS public.red_social_usuario (
    id_red_social_usuario SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuario(id_usuario) ON DELETE CASCADE,
    tipo_red_social_id INTEGER NOT NULL REFERENCES public.tipo_red_social(id_tipo_red_social),
    url VARCHAR(300) NOT NULL,
    fecha_creacion TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT red_social_usuario_unica UNIQUE (usuario_id, tipo_red_social_id, url)
);

INSERT INTO public.red_social_usuario (usuario_id, tipo_red_social_id, url)
SELECT u.id_usuario, trs.id_tipo_red_social, u.linkedin_url
FROM public.usuario u
JOIN public.tipo_red_social trs ON trs.codigo = 'linkedin'
WHERE u.linkedin_url IS NOT NULL AND BTRIM(u.linkedin_url) <> ''
ON CONFLICT DO NOTHING;

INSERT INTO public.red_social_usuario (usuario_id, tipo_red_social_id, url)
SELECT u.id_usuario, trs.id_tipo_red_social, u.github_url
FROM public.usuario u
JOIN public.tipo_red_social trs ON trs.codigo = 'github'
WHERE u.github_url IS NOT NULL AND BTRIM(u.github_url) <> ''
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. Verificacion de identidad
-- ============================================================

CREATE TABLE IF NOT EXISTS public.verificacion_identidad (
    id_verificacion SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE REFERENCES public.usuario(id_usuario) ON DELETE CASCADE,
    imagen_ci_id INTEGER REFERENCES public.imagen(id_imagen) ON DELETE SET NULL,
    estado_verificacion_id INTEGER NOT NULL REFERENCES public.estado_verificacion(id_estado_verificacion),
    motivo_rechazo TEXT,
    fecha_envio TIMESTAMP WITHOUT TIME ZONE,
    fecha_revision TIMESTAMP WITHOUT TIME ZONE,
    fecha_creacion TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMP WITHOUT TIME ZONE
);

INSERT INTO public.verificacion_identidad (
    usuario_id,
    imagen_ci_id,
    estado_verificacion_id,
    motivo_rechazo,
    fecha_envio,
    fecha_revision,
    fecha_creacion
)
SELECT
    u.id_usuario,
    u.id_imagen_ci,
    ev.id_estado_verificacion,
    u.motivo_rechazo_ci,
    CASE WHEN u.id_imagen_ci IS NOT NULL THEN u.fecha_registro ELSE NULL END,
    CASE
        WHEN LOWER(COALESCE(u.ci_estado, '')) IN ('verificado', 'aprobado', 'rechazado') THEN now()
        ELSE NULL
    END,
    u.fecha_registro
FROM public.usuario u
JOIN public.estado_verificacion ev ON ev.codigo = CASE
    WHEN u.ci_estado IS NULL OR BTRIM(u.ci_estado) = '' THEN 'sin_solicitar'
    WHEN LOWER(BTRIM(u.ci_estado)) IN ('verificado', 'aprobado') THEN 'aprobado'
    WHEN LOWER(BTRIM(u.ci_estado)) LIKE 'pendiente%' THEN 'pendiente'
    WHEN LOWER(BTRIM(u.ci_estado)) = 'rechazado' THEN 'rechazado'
    ELSE 'sin_solicitar'
END
ON CONFLICT (usuario_id) DO UPDATE SET
    imagen_ci_id = EXCLUDED.imagen_ci_id,
    estado_verificacion_id = EXCLUDED.estado_verificacion_id,
    motivo_rechazo = EXCLUDED.motivo_rechazo,
    fecha_actualizacion = now();

-- ============================================================
-- 4. Imagen: normalizar contexto sin romper columna legacy
-- ============================================================

ALTER TABLE public.imagen
    ADD COLUMN IF NOT EXISTS contexto_imagen_id INTEGER REFERENCES public.contexto_imagen(id_contexto_imagen);

UPDATE public.imagen i
SET contexto_imagen_id = ci.id_contexto_imagen
FROM public.contexto_imagen ci
WHERE ci.codigo = COALESCE(NULLIF(BTRIM(i.contexto), ''), 'otro')
  AND i.contexto_imagen_id IS NULL;

-- ============================================================
-- 5. Experiencia laboral, formacion academica y certificaciones
-- ============================================================

CREATE TABLE IF NOT EXISTS public.experiencia_laboral (
    id_experiencia_laboral SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuario(id_usuario) ON DELETE CASCADE,
    empresa VARCHAR(150) NOT NULL,
    cargo VARCHAR(150) NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    descripcion TEXT,
    referencias TEXT,
    fecha_creacion TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMP WITHOUT TIME ZONE
);

INSERT INTO public.experiencia_laboral (
    id_experiencia_laboral,
    usuario_id,
    empresa,
    cargo,
    fecha_inicio,
    fecha_fin,
    descripcion,
    referencias,
    fecha_creacion
)
SELECT
    e.id_experiencia,
    e.id_usuario,
    e.institucion_empresa,
    e.cargo_titulo,
    e.fecha_inicio,
    e.fecha_fin,
    e.descripcion,
    e.referencias,
    e.fecha_registro
FROM public.experiencia e
WHERE e.tipo = 'laboral'
ON CONFLICT (id_experiencia_laboral) DO UPDATE SET
    usuario_id = EXCLUDED.usuario_id,
    empresa = EXCLUDED.empresa,
    cargo = EXCLUDED.cargo,
    fecha_inicio = EXCLUDED.fecha_inicio,
    fecha_fin = EXCLUDED.fecha_fin,
    descripcion = EXCLUDED.descripcion,
    referencias = EXCLUDED.referencias,
    fecha_actualizacion = now();

CREATE TABLE IF NOT EXISTS public.formacion_academica (
    id_formacion_academica SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuario(id_usuario) ON DELETE CASCADE,
    institucion VARCHAR(150) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    nivel_academico_id INTEGER REFERENCES public.nivel_academico(id_nivel_academico),
    fecha_inicio DATE,
    fecha_fin DATE,
    descripcion TEXT,
    url_certificado VARCHAR(255),
    fecha_creacion TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMP WITHOUT TIME ZONE
);

INSERT INTO public.formacion_academica (
    id_formacion_academica,
    usuario_id,
    institucion,
    titulo,
    nivel_academico_id,
    fecha_inicio,
    fecha_fin,
    descripcion,
    url_certificado,
    fecha_creacion
)
SELECT
    e.id_experiencia,
    e.id_usuario,
    e.institucion_empresa,
    e.cargo_titulo,
    COALESCE(na.id_nivel_academico, (SELECT id_nivel_academico FROM public.nivel_academico WHERE nombre = 'No especificado')),
    e.fecha_inicio,
    e.fecha_fin,
    e.descripcion,
    e.url_certificado,
    e.fecha_registro
FROM public.experiencia e
LEFT JOIN public.nivel_academico na ON na.nombre = e.nivel_academico
WHERE e.tipo = 'academica'
ON CONFLICT (id_formacion_academica) DO UPDATE SET
    usuario_id = EXCLUDED.usuario_id,
    institucion = EXCLUDED.institucion,
    titulo = EXCLUDED.titulo,
    nivel_academico_id = EXCLUDED.nivel_academico_id,
    fecha_inicio = EXCLUDED.fecha_inicio,
    fecha_fin = EXCLUDED.fecha_fin,
    descripcion = EXCLUDED.descripcion,
    url_certificado = EXCLUDED.url_certificado,
    fecha_actualizacion = now();

CREATE TABLE IF NOT EXISTS public.certificacion (
    id_certificacion BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuario(id_usuario) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    institucion VARCHAR(150) NOT NULL,
    fecha_emision DATE NOT NULL,
    descripcion VARCHAR(500),
    fecha_creacion TIMESTAMP WITHOUT TIME ZONE,
    fecha_actualizacion TIMESTAMP WITHOUT TIME ZONE
);

INSERT INTO public.certificacion (
    id_certificacion,
    usuario_id,
    titulo,
    institucion,
    fecha_emision,
    descripcion,
    fecha_creacion,
    fecha_actualizacion
)
SELECT
    c.id,
    c.user_id,
    c.titulo,
    c.institucion,
    c.fecha_emision,
    c.descripcion,
    c.created_at,
    c.updated_at
FROM public.certificaciones c
ON CONFLICT (id_certificacion) DO UPDATE SET
    usuario_id = EXCLUDED.usuario_id,
    titulo = EXCLUDED.titulo,
    institucion = EXCLUDED.institucion,
    fecha_emision = EXCLUDED.fecha_emision,
    descripcion = EXCLUDED.descripcion,
    fecha_actualizacion = EXCLUDED.fecha_actualizacion;

SELECT setval(
    pg_get_serial_sequence('public.experiencia_laboral', 'id_experiencia_laboral'),
    COALESCE((SELECT MAX(id_experiencia_laboral) FROM public.experiencia_laboral), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('public.formacion_academica', 'id_formacion_academica'),
    COALESCE((SELECT MAX(id_formacion_academica) FROM public.formacion_academica), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('public.certificacion', 'id_certificacion'),
    COALESCE((SELECT MAX(id_certificacion) FROM public.certificacion), 1),
    true
);

-- ============================================================
-- 6. Habilidades: catalogos de tipo y categoria
-- ============================================================

ALTER TABLE public.habilidad
    ADD COLUMN IF NOT EXISTS tipo_habilidad_id INTEGER REFERENCES public.tipo_habilidad(id_tipo_habilidad),
    ADD COLUMN IF NOT EXISTS categoria_habilidad_id INTEGER REFERENCES public.categoria_habilidad(id_categoria_habilidad),
    ADD COLUMN IF NOT EXISTS usuario_creador_id INTEGER REFERENCES public.usuario(id_usuario) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS es_global BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP WITHOUT TIME ZONE;

UPDATE public.habilidad h
SET tipo_habilidad_id = th.id_tipo_habilidad
FROM public.tipo_habilidad th
WHERE th.codigo = h.tipo
  AND h.tipo_habilidad_id IS NULL;

UPDATE public.habilidad h
SET categoria_habilidad_id = ch.id_categoria_habilidad
FROM public.categoria_habilidad ch
WHERE ch.nombre = COALESCE(NULLIF(BTRIM(h.categoria), ''), 'General')
  AND h.categoria_habilidad_id IS NULL;

UPDATE public.habilidad h
SET es_global = false
WHERE COALESCE(h.categoria, '') ILIKE '%personaliz%';

-- Si existe la tabla legacy de personalizadas, asignamos creador cuando pueda inferirse.
UPDATE public.habilidad h
SET usuario_creador_id = uhp.id_usuario,
    es_global = false
FROM public.usuario_habilidad_personalizada uhp
WHERE uhp.id_habilidad = h.id_habilidad
  AND h.usuario_creador_id IS NULL;

-- ============================================================
-- 7. Roles y OAuth con nombres estables en español
-- ============================================================

CREATE TABLE IF NOT EXISTS public.usuario_rol (
    usuario_id INTEGER NOT NULL REFERENCES public.usuario(id_usuario) ON DELETE CASCADE,
    rol_id INTEGER NOT NULL REFERENCES public.rol(id_rol) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, rol_id)
);

INSERT INTO public.usuario_rol (usuario_id, rol_id)
SELECT id_usuario, id_rol
FROM public.rol_usuario
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.cuenta_oauth (
    id_cuenta_oauth INTEGER PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuario(id_usuario) ON DELETE CASCADE,
    proveedor VARCHAR(30) NOT NULL,
    proveedor_usuario_id VARCHAR(100) NOT NULL,
    token_acceso TEXT,
    token_refresco TEXT,
    fecha_creacion TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT cuenta_oauth_proveedor_unico UNIQUE (proveedor, proveedor_usuario_id)
);

INSERT INTO public.cuenta_oauth (
    id_cuenta_oauth,
    usuario_id,
    proveedor,
    proveedor_usuario_id,
    token_acceso,
    token_refresco,
    fecha_creacion
)
SELECT
    id_oauth,
    id_usuario,
    provider,
    provider_user_id,
    access_token,
    refresh_token,
    created_at
FROM public.oauth_account
ON CONFLICT (id_cuenta_oauth) DO UPDATE SET
    usuario_id = EXCLUDED.usuario_id,
    proveedor = EXCLUDED.proveedor,
    proveedor_usuario_id = EXCLUDED.proveedor_usuario_id,
    token_acceso = EXCLUDED.token_acceso,
    token_refresco = EXCLUDED.token_refresco;

-- ============================================================
-- 8. Bitacora unificada
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bitacora (
    id_bitacora BIGSERIAL PRIMARY KEY,
    origen_tabla VARCHAR(80),
    origen_id_bitacora INTEGER,
    usuario_accion_id INTEGER REFERENCES public.usuario(id_usuario) ON DELETE SET NULL,
    modulo_bitacora_id INTEGER NOT NULL REFERENCES public.modulo_bitacora(id_modulo_bitacora),
    accion_bitacora_id INTEGER REFERENCES public.accion_bitacora(id_accion_bitacora),
    accion VARCHAR(20),
    descripcion VARCHAR(255),
    valor_anterior JSONB,
    valor_nuevo JSONB,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora TIME WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIME,
    fecha_creacion TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS bitacora_migracion_unica
ON public.bitacora (origen_tabla, origen_id_bitacora)
WHERE origen_tabla IS NOT NULL AND origen_id_bitacora IS NOT NULL;

INSERT INTO public.bitacora (
    origen_tabla,
    origen_id_bitacora,
    usuario_accion_id,
    modulo_bitacora_id,
    accion_bitacora_id,
    accion,
    descripcion,
    valor_anterior,
    valor_nuevo,
    fecha,
    hora
)
SELECT
    'bitacora_usuario',
    b.id_bitacora,
    b.id_usuario_accion,
    mb.id_modulo_bitacora,
    ab.id_accion_bitacora,
    b.accion,
    b.descripcion,
    b.valor_anterior,
    b.valor_nuevo,
    b.fecha,
    b.hora
FROM public.bitacora_usuario b
JOIN public.modulo_bitacora mb ON mb.codigo = 'usuario'
LEFT JOIN public.accion_bitacora ab ON ab.codigo = b.accion
ON CONFLICT DO NOTHING;

INSERT INTO public.bitacora (
    origen_tabla,
    origen_id_bitacora,
    usuario_accion_id,
    modulo_bitacora_id,
    accion_bitacora_id,
    accion,
    descripcion,
    valor_anterior,
    valor_nuevo,
    fecha,
    hora
)
SELECT
    'bitacora_proyecto',
    b.id_bitacora,
    b.id_usuario_accion,
    mb.id_modulo_bitacora,
    ab.id_accion_bitacora,
    b.accion,
    b.descripcion,
    b.valor_anterior,
    b.valor_nuevo,
    b.fecha,
    b.hora
FROM public.bitacora_proyecto b
JOIN public.modulo_bitacora mb ON mb.codigo = 'proyecto'
LEFT JOIN public.accion_bitacora ab ON ab.codigo = b.accion
ON CONFLICT DO NOTHING;

INSERT INTO public.bitacora (
    origen_tabla,
    origen_id_bitacora,
    usuario_accion_id,
    modulo_bitacora_id,
    accion_bitacora_id,
    accion,
    descripcion,
    valor_anterior,
    valor_nuevo,
    fecha,
    hora
)
SELECT
    'bitacora_usuario_habilidad',
    b.id_bitacora,
    b.id_usuario_accion,
    mb.id_modulo_bitacora,
    ab.id_accion_bitacora,
    b.accion,
    b.descripcion,
    b.valor_anterior,
    b.valor_nuevo,
    b.fecha,
    b.hora
FROM public.bitacora_usuario_habilidad b
JOIN public.modulo_bitacora mb ON mb.codigo = 'habilidad'
LEFT JOIN public.accion_bitacora ab ON ab.codigo = b.accion
ON CONFLICT DO NOTHING;

INSERT INTO public.bitacora (
    origen_tabla,
    origen_id_bitacora,
    usuario_accion_id,
    modulo_bitacora_id,
    accion_bitacora_id,
    accion,
    descripcion,
    valor_anterior,
    valor_nuevo,
    fecha,
    hora
)
SELECT
    'bitacora_rol_usuario',
    b.id_bitacora,
    b.id_usuario_accion,
    mb.id_modulo_bitacora,
    ab.id_accion_bitacora,
    b.accion,
    b.descripcion,
    b.valor_anterior,
    b.valor_nuevo,
    b.fecha,
    b.hora
FROM public.bitacora_rol_usuario b
JOIN public.modulo_bitacora mb ON mb.codigo = 'rol'
LEFT JOIN public.accion_bitacora ab ON ab.codigo = b.accion
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. Indices recomendados
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_perfil_usuario_usuario_id ON public.perfil_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_red_social_usuario_usuario_id ON public.red_social_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_verificacion_identidad_usuario_id ON public.verificacion_identidad(usuario_id);
CREATE INDEX IF NOT EXISTS idx_experiencia_laboral_usuario_id ON public.experiencia_laboral(usuario_id);
CREATE INDEX IF NOT EXISTS idx_formacion_academica_usuario_id ON public.formacion_academica(usuario_id);
CREATE INDEX IF NOT EXISTS idx_certificacion_usuario_id ON public.certificacion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_habilidad_tipo_categoria ON public.habilidad(tipo_habilidad_id, categoria_habilidad_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_modulo_fecha ON public.bitacora(modulo_bitacora_id, fecha DESC, hora DESC);

COMMIT;
