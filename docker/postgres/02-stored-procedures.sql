SET search_path TO public;

-- ============================================================
--  PROCEDIMIENTOS ALMACENADOS (Stored Procedures)
--  Sistema Generador de Portafolios Digitales
--  Motor  : PostgreSQL 12+
--  Backend: Laravel 8 (Sanctum) — llamada via DB::select()
--  Versión: 4  |  Fecha: 2025
-- ============================================================
--
--  CONVENCIÓN DE RESPUESTA
--  Todos los SPs devuelven JSONB con la forma:
--    { "ok": true/false, "mensaje": "...", ...datos... }
--
--  CONVENCIÓN DE AUDITORÍA
--  Antes de llamar a cualquier SP de escritura, Laravel debe:
--    DB::statement("SET LOCAL app.usuario_actual = '{$userId}'");
--  Esto permite que los triggers de auditoría registren el actor.
--
--  ÍNDICE DE FUNCIONES
--  ── USUARIOS ──────────────────────────────────────────────
--   1. sp_registrar_usuario          Registro email/password
--   2. sp_login_usuario              Login (devuelve datos para Sanctum)
--   3. sp_obtener_perfil_usuario     Perfil completo por ID
--   4. sp_actualizar_perfil_usuario  Editar nombre/apellido/profesion/bio
--   5. sp_actualizar_foto_perfil     Subir/reemplazar foto de perfil
--   6. sp_cambiar_password           Cambiar contraseña con verificación
--   7. sp_desactivar_usuario         Soft-delete (activo = FALSE)
--   8. sp_vincular_github            Vincular cuenta OAuth GitHub
--   9. sp_buscar_por_github          Buscar usuario por provider_user_id
--  ── HABILIDADES ───────────────────────────────────────────
--  10. sp_listar_catalogo_habilidades  Catálogo completo agrupado
--  11. sp_listar_habilidades_usuario   Habilidades del usuario (con nivel)
--  12. sp_agregar_habilidad_usuario    Vincular habilidad al perfil
--  13. sp_agregar_habilidad_personalizada  Crear habilidad nueva + vincular
--  14. sp_editar_nivel_habilidad       Actualizar nivel (solo técnicas)
--  15. sp_eliminar_habilidad_usuario   Desvincular habilidad del perfil
--  16. sp_sincronizar_habilidades      Reemplaza TODAS las habilidades del usuario
--  ── PROYECTOS ─────────────────────────────────────────────
--  17. sp_crear_proyecto               Crea proyecto (sin imágenes aún)
--  18. sp_obtener_proyecto             Detalle completo de un proyecto
--  19. sp_listar_proyectos_usuario     Lista todos los proyectos del usuario
--  20. sp_actualizar_proyecto          Edita título/descripción/link/estado
--  21. sp_eliminar_proyecto            Elimina proyecto y sus imágenes/habilidades
--  22. sp_agregar_imagen_proyecto      Añade una imagen de evidencia (máx. 6)
--  23. sp_eliminar_imagen_proyecto     Elimina una imagen de evidencia
--  24. sp_sincronizar_habilidades_proyecto  Reemplaza chips de habilidades del proyecto
-- ============================================================


-- ============================================================
-- ╔══════════════════════════════════════════╗
-- ║              MÓDULO USUARIOS             ║
-- ╚══════════════════════════════════════════╝
-- ============================================================


-- ------------------------------------------------------------
-- 1. sp_registrar_usuario
--    Crea cuenta con email/password (hash bcrypt enviado desde Laravel).
--    Asigna automáticamente el rol 'usuario'.
--
--    Llamada Laravel:
--      DB::select("SELECT sp_registrar_usuario(?,?,?,?)",
--                 [$nombre, $apellido, $email, $passwordHash]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_registrar_usuario(
  p_nombre    VARCHAR(80),
  p_apellido  VARCHAR(80),
  p_email     VARCHAR(150),
  p_password_hash VARCHAR(255)   -- bcrypt hash generado en Laravel
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_usuario INT;
  v_id_rol     INT;
BEGIN
  -- Email único
  IF EXISTS (SELECT 1 FROM usuario WHERE email = LOWER(TRIM(p_email))) THEN
    RETURN jsonb_build_object(
      'ok',      FALSE,
      'codigo',  'EMAIL_DUPLICADO',
      'mensaje', 'El correo electrónico ya está registrado'
    );
  END IF;

  -- Obtener rol 'usuario'
  SELECT id_rol INTO v_id_rol FROM rol WHERE nombre = 'usuario';
  IF v_id_rol IS NULL THEN
    RETURN jsonb_build_object(
      'ok',      FALSE,
      'codigo',  'ROL_NO_ENCONTRADO',
      'mensaje', 'El rol de usuario no está definido en el sistema'
    );
  END IF;

  -- Insertar usuario
  INSERT INTO usuario (nombre, apellido, email, password_hash, activo, fecha_registro)
  VALUES (
    TRIM(p_nombre),
    TRIM(p_apellido),
    LOWER(TRIM(p_email)),
    p_password_hash,
    TRUE,
    NOW()
  )
  RETURNING id_usuario INTO v_id_usuario;

  -- Asignar rol
  INSERT INTO rol_usuario (id_rol, id_usuario) VALUES (v_id_rol, v_id_usuario);

  RETURN jsonb_build_object(
    'ok',         TRUE,
    'mensaje',    'Usuario registrado exitosamente',
    'id_usuario', v_id_usuario
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 2. sp_login_usuario
--    Devuelve datos necesarios para que Laravel valide el hash
--    con Hash::check() y emita el token Sanctum.
--    NO compara contraseñas aquí (responsabilidad del backend).
--
--    Llamada Laravel:
--      DB::select("SELECT sp_login_usuario(?)", [$email]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_login_usuario(
  p_email VARCHAR(150)
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_usr RECORD;
BEGIN
  SELECT id_usuario, nombre, apellido, email, password_hash,
         profesion, activo, id_imagen
  INTO   v_usr
  FROM   usuario
  WHERE  email = LOWER(TRIM(p_email));

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok',      FALSE,
      'codigo',  'CREDENCIALES_INVALIDAS',
      'mensaje', 'El correo electrónico no está registrado'
    );
  END IF;

  IF NOT v_usr.activo THEN
    RETURN jsonb_build_object(
      'ok',      FALSE,
      'codigo',  'CUENTA_INACTIVA',
      'mensaje', 'La cuenta ha sido desactivada'
    );
  END IF;

  RETURN jsonb_build_object(
    'ok',      TRUE,
    'usuario', jsonb_build_object(
      'id_usuario',   v_usr.id_usuario,
      'nombre',       v_usr.nombre,
      'apellido',     v_usr.apellido,
      'email',        v_usr.email,
      'password_hash',v_usr.password_hash,   -- Laravel llama Hash::check() con esto
      'profesion',    v_usr.profesion,
      'id_imagen',    v_usr.id_imagen
    )
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 3. sp_obtener_perfil_usuario
--    Devuelve perfil completo incluyendo URL de foto, roles,
--    conteo de habilidades y proyectos (para el dashboard).
--
--    Llamada Laravel:
--      DB::select("SELECT sp_obtener_perfil_usuario(?)", [$idUsuario]);
-- ------------------------------------------------------------
/*CREATE OR REPLACE FUNCTION sp_obtener_perfil_usuario(
  p_id_usuario INT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_perfil JSONB;
  v_foto   TEXT;
  v_roles  JSONB;
  v_stats  JSONB;
BEGIN
  SELECT nombre, apellido, email, profesion, biografia, activo,
         fecha_registro, id_imagen
  INTO   v_perfil
  FROM   usuario
  WHERE  id_usuario = p_id_usuario;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok',      FALSE,
      'codigo',  'USUARIO_NO_ENCONTRADO',
      'mensaje', 'El usuario no existe'
    );
  END IF;

  -- URL de foto de perfil
  SELECT ruta INTO v_foto
  FROM   imagen
  WHERE  id_imagen = (v_perfil->>'id_imagen')::INT;

  -- Roles
  SELECT jsonb_agg(r.nombre)
  INTO   v_roles
  FROM   rol_usuario ru
  JOIN   rol r ON r.id_rol = ru.id_rol
  WHERE  ru.id_usuario = p_id_usuario;

  -- Estadísticas rápidas
  SELECT jsonb_build_object(
    'total_habilidades_tecnicas',
      (SELECT COUNT(*) FROM usuario_habilidad uh
       JOIN habilidad h ON h.id_habilidad = uh.id_habilidad
       WHERE uh.id_usuario = p_id_usuario AND h.tipo = 'tecnica'),
    'total_habilidades_blandas',
      (SELECT COUNT(*) FROM usuario_habilidad uh
       JOIN habilidad h ON h.id_habilidad = uh.id_habilidad
       WHERE uh.id_usuario = p_id_usuario AND h.tipo = 'blanda'),
    'total_proyectos',
      (SELECT COUNT(*) FROM proyecto WHERE id_usuario = p_id_usuario),
    'nivel_promedio_tecnico',
      (SELECT ROUND(AVG(uh.nivel)) FROM usuario_habilidad uh
       JOIN habilidad h ON h.id_habilidad = uh.id_habilidad
       WHERE uh.id_usuario = p_id_usuario AND h.tipo = 'tecnica')
  ) INTO v_stats;

  RETURN jsonb_build_object(
    'ok',      TRUE,
    'perfil',  jsonb_build_object(
      'id_usuario',      p_id_usuario,
      'nombre',          v_perfil->>'nombre',
      'apellido',        v_perfil->>'apellido',
      'email',           v_perfil->>'email',
      'profesion',       v_perfil->>'profesion',
      'biografia',       v_perfil->>'biografia',
      'foto_url',        v_foto,
      'activo',          (v_perfil->>'activo')::BOOLEAN,
      'fecha_registro',  v_perfil->>'fecha_registro',
      'roles',           COALESCE(v_roles, '[]'::JSONB),
      'estadisticas',    v_stats
    )
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;*/


-- ------------------------------------------------------------
-- 4. sp_actualizar_perfil_usuario
--    Actualiza los campos editables desde la pantalla
--    EdicionPerfilPage (nombre, apellido, profesion, biografia).
--    Solo modifica campos con valor no nulo (COALESCE).
--
--    Llamada Laravel:
--      DB::select("SELECT sp_actualizar_perfil_usuario(?,?,?,?,?)",
--                 [$id, $nombre, $apellido, $profesion, $biografia]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_actualizar_perfil_usuario(
  p_id_usuario INT,
  p_nombre     VARCHAR(80)  DEFAULT NULL,
  p_apellido   VARCHAR(80)  DEFAULT NULL,
  p_profesion  VARCHAR(120) DEFAULT NULL,
  p_biografia  TEXT         DEFAULT NULL,
  p_titulo_profesional VARCHAR(150) DEFAULT NULL,
  p_linkedin_url VARCHAR(300) DEFAULT NULL,
  p_github_url VARCHAR(300) DEFAULT NULL,
  p_visibilidad VARCHAR(20) DEFAULT NULL,
  p_redes_sociales JSONB DEFAULT NULL,
  p_telefono   VARCHAR(50) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_nuevo JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM usuario WHERE id_usuario = p_id_usuario) THEN
    RETURN jsonb_build_object(
      'ok',      FALSE,
      'codigo',  'USUARIO_NO_ENCONTRADO',
      'mensaje', 'El usuario no existe'
    );
  END IF;

  PERFORM set_config('app.usuario_actual', p_id_usuario::TEXT, TRUE);

  UPDATE usuario
  SET
    nombre_modificado = CASE
      WHEN nombre_modificado = TRUE THEN TRUE
      WHEN p_nombre IS NOT NULL AND p_nombre <> nombre THEN TRUE
      WHEN p_apellido IS NOT NULL AND p_apellido <> apellido THEN TRUE
      ELSE nombre_modificado
    END,
    nombre    = CASE WHEN nombre_modificado = TRUE THEN nombre ELSE COALESCE(p_nombre, nombre) END,
    apellido  = CASE WHEN nombre_modificado = TRUE THEN apellido ELSE COALESCE(p_apellido, apellido) END,
    profesion = COALESCE(p_profesion, profesion),
    biografia = COALESCE(p_biografia, biografia),
    titulo_profesional = COALESCE(p_titulo_profesional, titulo_profesional),
    linkedin_url = COALESCE(p_linkedin_url, linkedin_url),
    github_url = COALESCE(p_github_url, github_url),
    visibilidad = COALESCE(p_visibilidad, visibilidad),
    redes_sociales = COALESCE(p_redes_sociales, redes_sociales),
    telefono = COALESCE(p_telefono, telefono)
  WHERE id_usuario = p_id_usuario
  RETURNING jsonb_build_object(
    'nombre',    nombre,
    'apellido',  apellido,
    'profesion', profesion,
    'biografia', biografia,
    'titulo_profesional', titulo_profesional,
    'linkedin_url', linkedin_url,
    'github_url', github_url,
    'visibilidad', visibilidad,
    'redes_sociales', redes_sociales,
    'nombre_modificado', nombre_modificado,
    'telefono', telefono
  ) INTO v_nuevo;

  RETURN jsonb_build_object(
    'ok',      TRUE,
    'mensaje', 'Perfil actualizado correctamente',
    'perfil',  v_nuevo
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 5. sp_actualizar_foto_perfil
--    Reemplaza la foto de perfil del usuario.
--    Laravel sube el archivo a storage y pasa la ruta relativa.
--    Elimina la imagen anterior automáticamente.
--
--    Llamada Laravel:
--      DB::select("SELECT sp_actualizar_foto_perfil(?,?,?,?,?)",
--                 [$idUsuario, $ruta, $nombre, $tipo, $tamanioKb]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_actualizar_foto_perfil(
  p_id_usuario INT,
  p_ruta       VARCHAR(300),
  p_nombre     VARCHAR(150) DEFAULT NULL,
  p_tipo       VARCHAR(20)  DEFAULT NULL,
  p_tamanio_kb INT          DEFAULT NULL,
  p_contexto   VARCHAR(20)  DEFAULT 'perfil'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_imagen_nuevo INT;
  v_id_imagen_viejo INT;
BEGIN
  SELECT id_imagen INTO v_id_imagen_viejo
  FROM   usuario WHERE id_usuario = p_id_usuario;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'USUARIO_NO_ENCONTRADO');
  END IF;

  -- Insertar nueva imagen
  INSERT INTO imagen (ruta, nombre, tipo, tamanio_kb, contexto)
  VALUES (p_ruta, p_nombre, p_tipo, p_tamanio_kb, COALESCE(p_contexto, 'perfil'))
  RETURNING id_imagen INTO v_id_imagen_nuevo;

  PERFORM set_config('app.usuario_actual', p_id_usuario::TEXT, TRUE);

  -- Asignar al usuario
  UPDATE usuario SET id_imagen = v_id_imagen_nuevo WHERE id_usuario = p_id_usuario;

  -- Eliminar imagen anterior (no rompemos la referencia; ya fue reemplazada)
  IF v_id_imagen_viejo IS NOT NULL THEN
    DELETE FROM imagen WHERE id_imagen = v_id_imagen_viejo;
  END IF;

  RETURN jsonb_build_object(
    'ok',        TRUE,
    'mensaje',   'Foto de perfil actualizada',
    'id_imagen', v_id_imagen_nuevo,
    'ruta',      p_ruta
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 6. sp_cambiar_password
--    Actualiza la contraseña. Laravel verifica el hash actual
--    antes de llamar este SP y pasa el nuevo hash directamente.
--
--    Llamada Laravel:
--      DB::select("SELECT sp_cambiar_password(?,?)", [$id, $newHash]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_cambiar_password(
  p_id_usuario       INT,
  p_nuevo_password_hash VARCHAR(255)
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM usuario WHERE id_usuario = p_id_usuario) THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'USUARIO_NO_ENCONTRADO');
  END IF;

  PERFORM set_config('app.usuario_actual', p_id_usuario::TEXT, TRUE);

  UPDATE usuario
  SET password_hash = p_nuevo_password_hash
  WHERE id_usuario = p_id_usuario;

  RETURN jsonb_build_object('ok', TRUE, 'mensaje', 'Contraseña actualizada correctamente');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 7. sp_desactivar_usuario
--    Soft-delete: activo = FALSE.  No borra registros.
--
--    Llamada Laravel:
--      DB::select("SELECT sp_desactivar_usuario(?)", [$id]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_desactivar_usuario(
  p_id_usuario INT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.usuario_actual', p_id_usuario::TEXT, TRUE);

  UPDATE usuario SET activo = FALSE WHERE id_usuario = p_id_usuario;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'USUARIO_NO_ENCONTRADO');
  END IF;

  RETURN jsonb_build_object('ok', TRUE, 'mensaje', 'Cuenta desactivada');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 8. sp_vincular_github
--    Vincula o actualiza la cuenta GitHub OAuth de un usuario.
--
--    Llamada Laravel (controlador OAuthController):
--      DB::select("SELECT sp_vincular_github(?,?,?,?)",
--                 [$idUsuario, $githubId, $accessToken, $refreshToken]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_vincular_github(
  p_id_usuario    INT,
  p_github_id     VARCHAR(100),
  p_access_token  TEXT DEFAULT NULL,
  p_refresh_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO oauth_account (id_usuario, provider, provider_user_id, access_token, refresh_token)
  VALUES (p_id_usuario, 'github', p_github_id, p_access_token, p_refresh_token)
  ON CONFLICT (provider, provider_user_id)
  DO UPDATE SET access_token  = EXCLUDED.access_token,
               refresh_token = EXCLUDED.refresh_token;

  RETURN jsonb_build_object('ok', TRUE, 'mensaje', 'Cuenta GitHub vinculada');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 9. sp_buscar_por_github
--    Busca un usuario por su provider_user_id de GitHub.
--    Usado en el flujo de login con GitHub.
--
--    Llamada Laravel:
--      DB::select("SELECT sp_buscar_por_github(?)", [$githubId]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_buscar_por_github(
  p_github_id VARCHAR(100)
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_usr RECORD;
BEGIN
  SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.activo, u.profesion
  INTO   v_usr
  FROM   usuario u
  JOIN   oauth_account oa ON oa.id_usuario = u.id_usuario
  WHERE  oa.provider = 'github'
    AND  oa.provider_user_id = p_github_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'NO_ENCONTRADO',
                              'mensaje', 'No hay usuario vinculado a este GitHub ID');
  END IF;

  RETURN jsonb_build_object(
    'ok',      TRUE,
    'usuario', row_to_json(v_usr)::JSONB
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ============================================================
-- ╔══════════════════════════════════════════╗
-- ║            MÓDULO HABILIDADES            ║
-- ╚══════════════════════════════════════════╝
-- ============================================================


-- ------------------------------------------------------------
-- 10. sp_listar_catalogo_habilidades
--     Devuelve el catálogo completo para los chips del frontend
--     (SkillSelector.jsx). Agrupa técnicas por categoría.
--     No requiere autenticación.
--
--     Respuesta:
--     {
--       "ok": true,
--       "tecnicas": { "Frontend":[...], "Backend":[...], ... },
--       "blandas":  [...]
--     }
--
--     Llamada Laravel:
--       DB::select("SELECT sp_listar_catalogo_habilidades()");
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_listar_catalogo_habilidades()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_tecnicas JSONB;
  v_blandas  JSONB;
BEGIN
  -- Técnicas agrupadas por categoría
  SELECT jsonb_object_agg(categoria, items)
  INTO   v_tecnicas
  FROM (
    SELECT
      categoria,
      jsonb_agg(
        jsonb_build_object(
          'id_habilidad', id_habilidad,
          'nombre',       nombre,
          'tipo',         tipo,
          'categoria',    categoria
        ) ORDER BY nombre
      ) AS items
    FROM  habilidad
    WHERE tipo = 'tecnica'
    GROUP BY categoria
  ) sub;

  -- Habilidades blandas
  SELECT jsonb_agg(
    jsonb_build_object(
      'id_habilidad', id_habilidad,
      'nombre',       nombre,
      'tipo',         tipo
    ) ORDER BY nombre
  )
  INTO  v_blandas
  FROM  habilidad
  WHERE tipo = 'blanda';

  RETURN jsonb_build_object(
    'ok',       TRUE,
    'tecnicas', COALESCE(v_tecnicas, '{}'::JSONB),
    'blandas',  COALESCE(v_blandas,  '[]'::JSONB)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 11. sp_listar_habilidades_usuario
--     Devuelve todas las habilidades vinculadas al usuario,
--     separadas en técnicas (con nivel) y blandas.
--     Alimenta la VistaEdicionPage.
--
--     Respuesta:
--     {
--       "ok": true,
--       "tecnicas": [{ "id_habilidad":1, "nombre":"React", "nivel":80 },...],
--       "blandas":  [{ "id_habilidad":26, "nombre":"Liderazgo" },...]
--     }
--
--     Llamada Laravel:
--       DB::select("SELECT sp_listar_habilidades_usuario(?)", [$idUsuario]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_listar_habilidades_usuario(
  p_id_usuario INT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_tecnicas JSONB;
  v_blandas  JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM usuario WHERE id_usuario = p_id_usuario) THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'USUARIO_NO_ENCONTRADO',
                              'mensaje', 'El usuario no existe');
  END IF;

  -- Técnicas: incluye nombre, nivel y categoría
  SELECT jsonb_agg(
    jsonb_build_object(
      'id_habilidad', h.id_habilidad,
      'nombre',       h.nombre,
      'categoria',    h.categoria,
      'nivel',        uh.nivel
    ) ORDER BY h.categoria, h.nombre
  )
  INTO  v_tecnicas
  FROM  usuario_habilidad uh
  JOIN  habilidad h ON h.id_habilidad = uh.id_habilidad
  WHERE uh.id_usuario = p_id_usuario
    AND h.tipo = 'tecnica';

  -- Blandas: solo nombre (sin nivel)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id_habilidad', h.id_habilidad,
      'nombre',       h.nombre
    ) ORDER BY h.nombre
  )
  INTO  v_blandas
  FROM  usuario_habilidad uh
  JOIN  habilidad h ON h.id_habilidad = uh.id_habilidad
  WHERE uh.id_usuario = p_id_usuario
    AND h.tipo = 'blanda';

  RETURN jsonb_build_object(
    'ok',       TRUE,
    'tecnicas', COALESCE(v_tecnicas, '[]'::JSONB),
    'blandas',  COALESCE(v_blandas,  '[]'::JSONB)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 12. sp_agregar_habilidad_usuario
--     Vincula una habilidad del catálogo al perfil del usuario.
--     Reglas:
--       · técnica: p_nivel obligatorio (0-100)
--       · blanda:  p_nivel se ignora / queda NULL
--       · No permite duplicados
--
--     Llamada Laravel:
--       DB::select("SELECT sp_agregar_habilidad_usuario(?,?,?)",
--                  [$idUsuario, $idHabilidad, $nivel]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_agregar_habilidad_usuario(
  p_id_usuario   INT,
  p_id_habilidad INT,
  p_nivel        SMALLINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_tipo   VARCHAR(10);
  v_nombre VARCHAR(80);
BEGIN
  IF NOT EXISTS (SELECT 1 FROM usuario WHERE id_usuario = p_id_usuario) THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'USUARIO_NO_ENCONTRADO',
                              'mensaje', 'El usuario no existe');
  END IF;

  SELECT tipo, nombre INTO v_tipo, v_nombre
  FROM   habilidad WHERE id_habilidad = p_id_habilidad;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'HABILIDAD_NO_VALIDA',
                              'mensaje', 'La habilidad no existe en el catálogo');
  END IF;

  IF EXISTS (SELECT 1 FROM usuario_habilidad
             WHERE id_usuario = p_id_usuario AND id_habilidad = p_id_habilidad) THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'DUPLICADO',
                              'mensaje', 'Ya tienes registrada esta habilidad');
  END IF;

  -- Validar nivel solo para técnicas
  IF v_tipo = 'tecnica' THEN
    IF p_nivel IS NULL OR p_nivel < 0 OR p_nivel > 100 THEN
      RETURN jsonb_build_object('ok', FALSE, 'codigo', 'NIVEL_INVALIDO',
                                'mensaje', 'El nivel debe ser un número entre 0 y 100');
    END IF;
  ELSE
    p_nivel := NULL;  -- blandas no tienen nivel
  END IF;

  PERFORM set_config('app.usuario_actual', p_id_usuario::TEXT, TRUE);

  INSERT INTO usuario_habilidad (id_usuario, id_habilidad, nivel)
  VALUES (p_id_usuario, p_id_habilidad, p_nivel);

  RETURN jsonb_build_object(
    'ok',           TRUE,
    'codigo',       'CREADO',
    'mensaje',      'Habilidad agregada correctamente',
    'id_habilidad', p_id_habilidad,
    'nombre',       v_nombre,
    'tipo',         v_tipo,
    'nivel',        p_nivel
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 13. sp_agregar_habilidad_personalizada
--     El usuario escribe una habilidad que NO está en el catálogo
--     (opción "Otro" del frontend). Se crea en la tabla habilidad
--     y se vincula al usuario en un solo paso.
--
--     Llamada Laravel:
--       DB::select("SELECT sp_agregar_habilidad_personalizada(?,?,?,?)",
--                  [$idUsuario, $nombre, $tipo, $nivel]);
--       $tipo = 'tecnica' | 'blanda'
--       $nivel = null si blanda
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_agregar_habilidad_personalizada(
  p_id_usuario INT,
  p_nombre     VARCHAR(80),
  p_tipo       VARCHAR(10),    -- 'tecnica' | 'blanda'
  p_nivel      SMALLINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_habilidad INT;
  v_nombre_trim  VARCHAR(80);
BEGIN
  IF NOT EXISTS (SELECT 1 FROM usuario WHERE id_usuario = p_id_usuario) THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'USUARIO_NO_ENCONTRADO',
                              'mensaje', 'El usuario no existe');
  END IF;

  IF p_tipo NOT IN ('tecnica', 'blanda') THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'TIPO_INVALIDO',
                              'mensaje', 'El tipo debe ser "tecnica" o "blanda"');
  END IF;

  v_nombre_trim := TRIM(p_nombre);
  IF v_nombre_trim = '' OR v_nombre_trim IS NULL THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'NOMBRE_REQUERIDO',
                              'mensaje', 'El nombre de la habilidad es obligatorio');
  END IF;

  IF p_tipo = 'tecnica' THEN
    IF p_nivel IS NULL OR p_nivel < 0 OR p_nivel > 100 THEN
      RETURN jsonb_build_object('ok', FALSE, 'codigo', 'NIVEL_INVALIDO',
                                'mensaje', 'El nivel debe ser un número entre 0 y 100');
    END IF;
  ELSE
    p_nivel := NULL;
  END IF;

  -- Buscar o crear la habilidad en el catálogo
  SELECT id_habilidad INTO v_id_habilidad
  FROM   habilidad
  WHERE  LOWER(nombre) = LOWER(v_nombre_trim) AND tipo = p_tipo;

  IF NOT FOUND THEN
    INSERT INTO habilidad (nombre, tipo, categoria)
    VALUES (v_nombre_trim, p_tipo, CASE WHEN p_tipo = 'tecnica' THEN 'Personalizada' ELSE NULL END)
    RETURNING id_habilidad INTO v_id_habilidad;
  END IF;

  -- Verificar duplicado
  IF EXISTS (SELECT 1 FROM usuario_habilidad
             WHERE id_usuario = p_id_usuario AND id_habilidad = v_id_habilidad) THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'DUPLICADO',
                              'mensaje', 'Ya tienes registrada esta habilidad');
  END IF;

  PERFORM set_config('app.usuario_actual', p_id_usuario::TEXT, TRUE);

  INSERT INTO usuario_habilidad (id_usuario, id_habilidad, nivel)
  VALUES (p_id_usuario, v_id_habilidad, p_nivel);

  RETURN jsonb_build_object(
    'ok',           TRUE,
    'codigo',       'CREADO',
    'mensaje',      'Habilidad personalizada agregada',
    'id_habilidad', v_id_habilidad,
    'nombre',       v_nombre_trim,
    'tipo',         p_tipo,
    'nivel',        p_nivel
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 14. sp_editar_nivel_habilidad
--     Actualiza el nivel de una habilidad TÉCNICA ya vinculada.
--     No aplica a blandas.
--
--     Llamada Laravel:
--       DB::select("SELECT sp_editar_nivel_habilidad(?,?,?)",
--                  [$idUsuario, $idHabilidad, $nuevoNivel]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_editar_nivel_habilidad(
  p_id_usuario   INT,
  p_id_habilidad INT,
  p_nuevo_nivel  SMALLINT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_tipo   VARCHAR(10);
  v_nombre VARCHAR(80);
BEGIN
  SELECT h.tipo, h.nombre INTO v_tipo, v_nombre
  FROM   usuario_habilidad uh
  JOIN   habilidad h ON h.id_habilidad = uh.id_habilidad
  WHERE  uh.id_usuario   = p_id_usuario
    AND  uh.id_habilidad = p_id_habilidad;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'NO_ENCONTRADO',
                              'mensaje', 'La habilidad no existe en tu perfil');
  END IF;

  IF v_tipo = 'blanda' THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'OPERACION_NO_PERMITIDA',
                              'mensaje', 'Las habilidades blandas no manejan nivel');
  END IF;

  IF p_nuevo_nivel IS NULL OR p_nuevo_nivel < 0 OR p_nuevo_nivel > 100 THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'NIVEL_INVALIDO',
                              'mensaje', 'El nivel debe ser un valor entre 0 y 100');
  END IF;

  PERFORM set_config('app.usuario_actual', p_id_usuario::TEXT, TRUE);

  UPDATE usuario_habilidad
  SET    nivel = p_nuevo_nivel
  WHERE  id_usuario = p_id_usuario AND id_habilidad = p_id_habilidad;

  RETURN jsonb_build_object(
    'ok',           TRUE,
    'codigo',       'ACTUALIZADO',
    'mensaje',      'Nivel actualizado correctamente',
    'id_habilidad', p_id_habilidad,
    'nombre',       v_nombre,
    'nuevo_nivel',  p_nuevo_nivel
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 15. sp_eliminar_habilidad_usuario
--     Desvincula una habilidad del perfil del usuario.
--
--     Llamada Laravel:
--       DB::select("SELECT sp_eliminar_habilidad_usuario(?,?)",
--                  [$idUsuario, $idHabilidad]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_eliminar_habilidad_usuario(
  p_id_usuario   INT,
  p_id_habilidad INT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_nombre VARCHAR(80);
  v_tipo   VARCHAR(10);
BEGIN
  SELECT h.nombre, h.tipo INTO v_nombre, v_tipo
  FROM   usuario_habilidad uh
  JOIN   habilidad h ON h.id_habilidad = uh.id_habilidad
  WHERE  uh.id_usuario = p_id_usuario AND uh.id_habilidad = p_id_habilidad;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'NO_ENCONTRADO',
                              'mensaje', 'La habilidad no existe en tu perfil');
  END IF;

  PERFORM set_config('app.usuario_actual', p_id_usuario::TEXT, TRUE);

  DELETE FROM usuario_habilidad
  WHERE  id_usuario = p_id_usuario AND id_habilidad = p_id_habilidad;

  RETURN jsonb_build_object(
    'ok',           TRUE,
    'codigo',       'ELIMINADO',
    'mensaje',      'Habilidad eliminada correctamente',
    'id_habilidad', p_id_habilidad,
    'nombre',       v_nombre,
    'tipo',         v_tipo
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 16. sp_sincronizar_habilidades
--     Reemplaza TODAS las habilidades del usuario de un tipo dado.
--     Usado por el modal "Editar Habilidad" de VistaEdicionPage
--     cuando el usuario elimina/modifica niveles y guarda.
--     p_habilidades: array JSON [{"id_habilidad":1,"nivel":80}, ...]
--                    Para blandas, nivel puede omitirse o ser null.
--
--     Llamada Laravel:
--       DB::select("SELECT sp_sincronizar_habilidades(?,?,?::jsonb)",
--                  [$idUsuario, $tipo, json_encode($array)]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_sincronizar_habilidades(
  p_id_usuario  INT,
  p_tipo        VARCHAR(10),   -- 'tecnica' | 'blanda'
  p_habilidades JSONB          -- [{"id_habilidad":1,"nivel":80}, ...]
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_item       JSONB;
  v_id_hab     INT;
  v_nivel      SMALLINT;
  v_tipo_check VARCHAR(10);
  v_insertados INT := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM usuario WHERE id_usuario = p_id_usuario) THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'USUARIO_NO_ENCONTRADO');
  END IF;

  IF p_tipo NOT IN ('tecnica', 'blanda') THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'TIPO_INVALIDO');
  END IF;

  PERFORM set_config('app.usuario_actual', p_id_usuario::TEXT, TRUE);

  -- Eliminar habilidades actuales del tipo indicado
  DELETE FROM usuario_habilidad uh
  USING  habilidad h
  WHERE  uh.id_habilidad = h.id_habilidad
    AND  uh.id_usuario   = p_id_usuario
    AND  h.tipo          = p_tipo;

  -- Reinsertar las nuevas
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_habilidades)
  LOOP
    v_id_hab := (v_item->>'id_habilidad')::INT;
    v_nivel  := CASE WHEN p_tipo = 'tecnica'
                     THEN (v_item->>'nivel')::SMALLINT
                     ELSE NULL END;

    -- Verificar que la habilidad existe y es del tipo correcto
    SELECT tipo INTO v_tipo_check FROM habilidad WHERE id_habilidad = v_id_hab;
    CONTINUE WHEN v_tipo_check IS NULL OR v_tipo_check != p_tipo;

    INSERT INTO usuario_habilidad (id_usuario, id_habilidad, nivel)
    VALUES (p_id_usuario, v_id_hab, v_nivel)
    ON CONFLICT DO NOTHING;

    v_insertados := v_insertados + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok',        TRUE,
    'mensaje',   'Habilidades sincronizadas correctamente',
    'tipo',      p_tipo,
    'insertados', v_insertados
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;

-- ============================================================
-- CORRECCIONES DE SPs
-- Ejecutar en orden en PostgreSQL (pgAdmin o psql)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- FIX 1: sp_obtener_perfil_usuario
--   BUG: SELECT col1, col2... INTO v_perfil (JSONB) falla porque
--        PostgreSQL no puede convertir implícitamente un ROW a JSONB.
--   FIX: Usar to_jsonb() para la conversión explícita.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sp_obtener_perfil_usuario(
  p_id_usuario INT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_perfil JSONB;
  v_foto   TEXT;
  v_roles  JSONB;
  v_stats  JSONB;
BEGIN
  -- FIX: usar to_jsonb(sub) en lugar de SELECT ... INTO v_perfil directamente
  SELECT to_jsonb(sub) INTO v_perfil
  FROM (
    SELECT nombre, apellido, email, profesion, biografia, activo,
           fecha_registro, id_imagen, titulo_profesional, linkedin_url,
           github_url, visibilidad, nombre_modificado, redes_sociales,
           ci_estado, id_imagen_ci, telefono
    FROM   usuario
    WHERE  id_usuario = p_id_usuario
  ) sub;

  IF v_perfil IS NULL THEN
    RETURN jsonb_build_object(
      'ok',      FALSE,
      'codigo',  'USUARIO_NO_ENCONTRADO',
      'mensaje', 'El usuario no existe'
    );
  END IF;

  -- URL de foto de perfil (FIX: manejar id_imagen NULL correctamente)
  IF (v_perfil->>'id_imagen') IS NOT NULL THEN
    SELECT ruta INTO v_foto
    FROM   imagen
    WHERE  id_imagen = (v_perfil->>'id_imagen')::INT;
  END IF;

  -- Roles
  SELECT jsonb_agg(r.nombre)
  INTO   v_roles
  FROM   rol_usuario ru
  JOIN   rol r ON r.id_rol = ru.id_rol
  WHERE  ru.id_usuario = p_id_usuario;

  -- Estadísticas rápidas
  SELECT jsonb_build_object(
    'total_habilidades_tecnicas',
      (SELECT COUNT(*) FROM usuario_habilidad uh
       JOIN habilidad h ON h.id_habilidad = uh.id_habilidad
       WHERE uh.id_usuario = p_id_usuario AND h.tipo = 'tecnica'),
    'total_habilidades_blandas',
      (SELECT COUNT(*) FROM usuario_habilidad uh
       JOIN habilidad h ON h.id_habilidad = uh.id_habilidad
       WHERE uh.id_usuario = p_id_usuario AND h.tipo = 'blanda'),
    'total_proyectos',
      (SELECT COUNT(*) FROM proyecto WHERE id_usuario = p_id_usuario),
    'nivel_promedio_tecnico',
      (SELECT ROUND(AVG(uh.nivel)) FROM usuario_habilidad uh
       JOIN habilidad h ON h.id_habilidad = uh.id_habilidad
       WHERE uh.id_usuario = p_id_usuario AND h.tipo = 'tecnica')
  ) INTO v_stats;

  RETURN jsonb_build_object(
    'ok',      TRUE,
    'perfil',  jsonb_build_object(
      'id_usuario',      p_id_usuario,
      'nombre',          v_perfil->>'nombre',
      'apellido',        v_perfil->>'apellido',
      'email',           v_perfil->>'email',
      'profesion',       v_perfil->>'profesion',
      'biografia',       v_perfil->>'biografia',
      'titulo_profesional', v_perfil->>'titulo_profesional',
      'linkedin_url',    v_perfil->>'linkedin_url',
      'github_url',      v_perfil->>'github_url',
      'redes_sociales',  COALESCE(v_perfil->'redes_sociales', '[]'::jsonb),
      'visibilidad',     v_perfil->>'visibilidad',
      'nombre_modificado', (v_perfil->>'nombre_modificado')::BOOLEAN,
      'foto_url',        v_foto,
      'ci_estado',       v_perfil->>'ci_estado',
      'telefono',        v_perfil->>'telefono',
      'activo',          (v_perfil->>'activo')::BOOLEAN,
      'fecha_registro',  v_perfil->>'fecha_registro',
      'roles',           COALESCE(v_roles, '[]'::JSONB),
      'estadisticas',    v_stats
    )
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ────────────────────────────────────────────────────────────
-- FIX 2: sp_sincronizar_habilidades_proyecto
--   BUG: array_append(text[], character varying) falla por 
--        type mismatch entre TEXT[] y VARCHAR(80).
--   FIX: Castear v_nombre a TEXT explícitamente.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sp_sincronizar_habilidades_proyecto(
  p_id_proyecto     INT,
  p_id_usuario      INT,
  p_ids_habilidades JSONB    -- [1, 4, 7]  array de id_habilidad
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_hab  INT;
  v_nombres TEXT[] := '{}';
  v_nombre  TEXT;  -- FIX: cambiar de VARCHAR(80) a TEXT para compatibilidad con array_append
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM proyecto
    WHERE id_proyecto = p_id_proyecto AND id_usuario = p_id_usuario
  ) THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'PROYECTO_NO_ENCONTRADO',
                              'mensaje', 'El proyecto no existe o no te pertenece');
  END IF;

  -- Eliminar habilidades actuales del proyecto
  DELETE FROM proyecto_habilidad WHERE id_proyecto = p_id_proyecto;

  -- Reinsertar las nuevas (solo técnicas)
  FOR v_id_hab IN SELECT value::INT FROM jsonb_array_elements_text(p_ids_habilidades)
  LOOP
    SELECT nombre::TEXT INTO v_nombre
    FROM   habilidad
    WHERE  id_habilidad = v_id_hab AND tipo = 'tecnica';

    CONTINUE WHEN v_nombre IS NULL;

    INSERT INTO proyecto_habilidad (id_proyecto, id_habilidad)
    VALUES (p_id_proyecto, v_id_hab)
    ON CONFLICT DO NOTHING;

    v_nombres := array_append(v_nombres, v_nombre);
  END LOOP;

  RETURN jsonb_build_object(
    'ok',         TRUE,
    'mensaje',    'Habilidades del proyecto sincronizadas',
    'habilidades', to_jsonb(v_nombres)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ============================================================
-- ╔══════════════════════════════════════════╗
-- ║             MÓDULO PROYECTOS             ║
-- ╚══════════════════════════════════════════╝
-- ============================================================


-- ------------------------------------------------------------
-- 17. sp_crear_proyecto
--     Crea un nuevo proyecto para el usuario.
--     Las imágenes y habilidades se agregan por separado
--     (sp_agregar_imagen_proyecto / sp_sincronizar_habilidades_proyecto).
--
--     Llamada Laravel:
--       DB::select("SELECT sp_crear_proyecto(?,?,?,?)",
--                  [$idUsuario, $titulo, $descripcion, $urlRepo]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_crear_proyecto(
  p_id_usuario    INT,
  p_nombre        VARCHAR(150),
  p_descripcion   TEXT         DEFAULT NULL,
  p_url_repo      VARCHAR(300) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_proyecto INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM usuario WHERE id_usuario = p_id_usuario AND activo = TRUE) THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'USUARIO_NO_ENCONTRADO',
                              'mensaje', 'El usuario no existe o está inactivo');
  END IF;

  IF TRIM(p_nombre) = '' OR p_nombre IS NULL THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'NOMBRE_REQUERIDO',
                              'mensaje', 'El título del proyecto es obligatorio');
  END IF;

  -- Validar nombre duplicado para el mismo usuario
  IF EXISTS (
    SELECT 1 FROM proyecto
    WHERE id_usuario = p_id_usuario
      AND LOWER(TRIM(nombre)) = LOWER(TRIM(p_nombre))
  ) THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'NOMBRE_DUPLICADO',
                              'mensaje', 'Ya tienes un proyecto con este nombre');
  END IF;

  PERFORM set_config('app.usuario_actual', p_id_usuario::TEXT, TRUE);

  INSERT INTO proyecto (id_usuario, nombre, descripcion, url_repositorio, estado, visible_portafolio, fecha_creacion)
  VALUES (p_id_usuario, TRIM(p_nombre), p_descripcion, NULLIF(TRIM(COALESCE(p_url_repo,'')),'' ), 'en_desarrollo', FALSE, NOW())
  RETURNING id_proyecto INTO v_id_proyecto;

  RETURN jsonb_build_object(
    'ok',          TRUE,
    'mensaje',     'Proyecto creado correctamente',
    'id_proyecto', v_id_proyecto
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 18. sp_obtener_proyecto
--     Devuelve el detalle completo de un proyecto:
--     datos + imágenes ordenadas + habilidades usadas.
--
--     Llamada Laravel:
--       DB::select("SELECT sp_obtener_proyecto(?,?)",
--                  [$idProyecto, $idUsuario]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_obtener_proyecto(
  p_id_proyecto INT,
  p_id_usuario  INT    -- para verificar que el proyecto pertenece al usuario
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_proyecto  JSONB;
  v_imagenes  JSONB;
  v_habs      JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id_proyecto',       p.id_proyecto,
    'id_usuario',        p.id_usuario,
    'nombre',            p.nombre,
    'descripcion',       p.descripcion,
    'url_repositorio',   p.url_repositorio,
    'fecha_creacion',    p.fecha_creacion,
    'estado',            p.estado,
    'visible_portafolio',p.visible_portafolio
  )
  INTO  v_proyecto
  FROM  proyecto p
  WHERE p.id_proyecto = p_id_proyecto
    AND p.id_usuario  = p_id_usuario;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'PROYECTO_NO_ENCONTRADO',
                              'mensaje', 'El proyecto no existe o no te pertenece');
  END IF;

  -- Imágenes ordenadas por slot
  SELECT jsonb_agg(
    jsonb_build_object(
      'id_imagen', i.id_imagen,
      'ruta',      i.ruta,
      'orden',     pi2.orden
    ) ORDER BY pi2.orden
  )
  INTO  v_imagenes
  FROM  proyecto_imagen pi2
  JOIN  imagen i ON i.id_imagen = pi2.id_imagen
  WHERE pi2.id_proyecto = p_id_proyecto;

  -- Habilidades técnicas del proyecto
  SELECT jsonb_agg(
    jsonb_build_object(
      'id_habilidad', h.id_habilidad,
      'nombre',       h.nombre,
      'categoria',    h.categoria
    ) ORDER BY h.nombre
  )
  INTO  v_habs
  FROM  proyecto_habilidad ph
  JOIN  habilidad h ON h.id_habilidad = ph.id_habilidad
  WHERE ph.id_proyecto = p_id_proyecto;

  RETURN jsonb_build_object(
    'ok',         TRUE,
    'proyecto',   v_proyecto
                  || jsonb_build_object(
                       'imagenes',    COALESCE(v_imagenes, '[]'::JSONB),
                       'habilidades', COALESCE(v_habs,     '[]'::JSONB)
                     )
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 19. sp_listar_proyectos_usuario
--     Lista todos los proyectos del usuario con primera imagen
--     y chips de habilidades. Alimenta la VistaEdicionPage.
--
--     Llamada Laravel:
--       DB::select("SELECT sp_listar_proyectos_usuario(?)", [$idUsuario]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_listar_proyectos_usuario(
  p_id_usuario INT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_proyectos JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM usuario WHERE id_usuario = p_id_usuario) THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'USUARIO_NO_ENCONTRADO');
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id_proyecto',       p.id_proyecto,
      'nombre',            p.nombre,
      'descripcion',       p.descripcion,
      'url_repositorio',   p.url_repositorio,
      'fecha_creacion',    p.fecha_creacion,
      'estado',            p.estado,
      'visible_portafolio',p.visible_portafolio,
      -- Primera imagen (portada de la tarjeta)
      'imagen_portada', (
        SELECT i.ruta
        FROM   proyecto_imagen pi2
        JOIN   imagen i ON i.id_imagen = pi2.id_imagen
        WHERE  pi2.id_proyecto = p.id_proyecto
        ORDER  BY pi2.orden LIMIT 1
      ),
      -- Chips de habilidades
      'habilidades', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('id_habilidad', h.id_habilidad, 'nombre', h.nombre)
                         ORDER BY h.nombre)
        FROM   proyecto_habilidad ph
        JOIN   habilidad h ON h.id_habilidad = ph.id_habilidad
        WHERE  ph.id_proyecto = p.id_proyecto
      ), '[]'::JSONB)
    ) ORDER BY p.fecha_creacion DESC
  )
  INTO v_proyectos
  FROM proyecto p
  WHERE p.id_usuario = p_id_usuario;

  RETURN jsonb_build_object(
    'ok',        TRUE,
    'proyectos', COALESCE(v_proyectos, '[]'::JSONB)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 20. sp_actualizar_proyecto
--     Edita título, descripción y URL de un proyecto existente.
--     Las imágenes y habilidades se sincronizan con sus propios SPs.
--
--     Llamada Laravel:
--       DB::select("SELECT sp_actualizar_proyecto(?,?,?,?,?)",
--                  [$idProyecto, $idUsuario, $nombre, $desc, $urlRepo]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_actualizar_proyecto(
  p_id_proyecto INT,
  p_id_usuario  INT,
  p_nombre      VARCHAR(150) DEFAULT NULL,
  p_descripcion TEXT         DEFAULT NULL,
  p_url_repo    VARCHAR(300) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_nuevo JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM proyecto
    WHERE id_proyecto = p_id_proyecto AND id_usuario = p_id_usuario
  ) THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'PROYECTO_NO_ENCONTRADO',
                              'mensaje', 'El proyecto no existe o no te pertenece');
  END IF;

  -- Validar nombre duplicado (excluyendo el proyecto actual)
  IF p_nombre IS NOT NULL AND TRIM(p_nombre) != '' THEN
    IF EXISTS (
      SELECT 1 FROM proyecto
      WHERE id_usuario = p_id_usuario
        AND id_proyecto != p_id_proyecto
        AND LOWER(TRIM(nombre)) = LOWER(TRIM(p_nombre))
    ) THEN
      RETURN jsonb_build_object('ok', FALSE, 'codigo', 'NOMBRE_DUPLICADO',
                                'mensaje', 'Ya tienes un proyecto con este nombre');
    END IF;
  END IF;

  PERFORM set_config('app.usuario_actual', p_id_usuario::TEXT, TRUE);

  UPDATE proyecto
  SET
    nombre          = COALESCE(NULLIF(TRIM(p_nombre),''),    nombre),
    descripcion     = COALESCE(p_descripcion,                descripcion),
    url_repositorio = CASE
                        WHEN p_url_repo IS NULL         THEN url_repositorio
                        WHEN TRIM(p_url_repo) = ''      THEN NULL
                        ELSE TRIM(p_url_repo)
                      END
  WHERE id_proyecto = p_id_proyecto
  RETURNING jsonb_build_object(
    'id_proyecto',     id_proyecto,
    'nombre',          nombre,
    'descripcion',     descripcion,
    'url_repositorio', url_repositorio
  ) INTO v_nuevo;

  RETURN jsonb_build_object(
    'ok',       TRUE,
    'mensaje',  'Proyecto actualizado correctamente',
    'proyecto', v_nuevo
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 21. sp_eliminar_proyecto
--     Elimina el proyecto junto con todas sus imágenes y
--     relaciones de habilidades (CASCADE en la BD).
--     Los archivos físicos deben eliminarse en el backend Laravel.
--
--     Llamada Laravel:
--       DB::select("SELECT sp_eliminar_proyecto(?,?)",
--                  [$idProyecto, $idUsuario]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_eliminar_proyecto(
  p_id_proyecto INT,
  p_id_usuario  INT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_nombre VARCHAR(150);
BEGIN
  SELECT nombre INTO v_nombre
  FROM   proyecto
  WHERE  id_proyecto = p_id_proyecto AND id_usuario = p_id_usuario;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'PROYECTO_NO_ENCONTRADO',
                              'mensaje', 'El proyecto no existe o no te pertenece');
  END IF;

  PERFORM set_config('app.usuario_actual', p_id_usuario::TEXT, TRUE);

  -- Eliminar imágenes del disco: Laravel debe hacerlo ANTES de llamar este SP
  -- Aquí solo eliminamos los registros (CASCADE borra proyecto_imagen y proyecto_habilidad)
  DELETE FROM imagen
  WHERE id_imagen IN (
    SELECT id_imagen FROM proyecto_imagen WHERE id_proyecto = p_id_proyecto
  );

  DELETE FROM proyecto WHERE id_proyecto = p_id_proyecto;

  RETURN jsonb_build_object(
    'ok',      TRUE,
    'mensaje', 'Proyecto "' || v_nombre || '" eliminado correctamente'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 22. sp_agregar_imagen_proyecto
--     Añade una imagen de evidencia a un proyecto (máximo 6).
--     Laravel sube el archivo y pasa la ruta relativa.
--
--     Llamada Laravel:
--       DB::select("SELECT sp_agregar_imagen_proyecto(?,?,?,?,?,?)",
--                  [$idProyecto, $idUsuario, $ruta, $nombre, $tipo, $tamanioKb]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_agregar_imagen_proyecto(
  p_id_proyecto INT,
  p_id_usuario  INT,
  p_ruta        VARCHAR(300),
  p_nombre      VARCHAR(150) DEFAULT NULL,
  p_tipo        VARCHAR(20)  DEFAULT NULL,
  p_tamanio_kb  INT          DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_actual INT;
  v_id_imagen    INT;
  v_orden        SMALLINT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM proyecto
    WHERE id_proyecto = p_id_proyecto AND id_usuario = p_id_usuario
  ) THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'PROYECTO_NO_ENCONTRADO',
                              'mensaje', 'El proyecto no existe o no te pertenece');
  END IF;

  -- Contar imágenes actuales
  SELECT COUNT(*) INTO v_total_actual
  FROM   proyecto_imagen WHERE id_proyecto = p_id_proyecto;

  IF v_total_actual >= 6 THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'LIMITE_IMAGENES',
                              'mensaje', 'El proyecto ya tiene el máximo de 6 imágenes');
  END IF;

  v_orden := v_total_actual + 1;

  -- Guardar metadatos de imagen
  INSERT INTO imagen (ruta, nombre, tipo, tamanio_kb, contexto)
  VALUES (p_ruta, p_nombre, p_tipo, p_tamanio_kb, 'proyecto')
  RETURNING id_imagen INTO v_id_imagen;

  -- Vincular al proyecto
  INSERT INTO proyecto_imagen (id_proyecto, id_imagen, orden)
  VALUES (p_id_proyecto, v_id_imagen, v_orden);

  RETURN jsonb_build_object(
    'ok',        TRUE,
    'mensaje',   'Imagen agregada correctamente',
    'id_imagen', v_id_imagen,
    'orden',     v_orden,
    'ruta',      p_ruta
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 23. sp_eliminar_imagen_proyecto
--     Elimina una imagen de evidencia de un proyecto.
--     Los archivos físicos deben eliminarse en el backend Laravel.
--
--     Llamada Laravel:
--       DB::select("SELECT sp_eliminar_imagen_proyecto(?,?,?)",
--                  [$idImagen, $idProyecto, $idUsuario]);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_eliminar_imagen_proyecto(
  p_id_imagen   INT,
  p_id_proyecto INT,
  p_id_usuario  INT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_ruta VARCHAR(300);
BEGIN
  -- Verificar que la imagen pertenece al proyecto y el proyecto al usuario
  IF NOT EXISTS (
    SELECT 1 FROM proyecto p
    JOIN proyecto_imagen pi2 ON pi2.id_proyecto = p.id_proyecto
    WHERE p.id_proyecto = p_id_proyecto
      AND p.id_usuario  = p_id_usuario
      AND pi2.id_imagen = p_id_imagen
  ) THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'IMAGEN_NO_ENCONTRADA',
                              'mensaje', 'La imagen no existe en este proyecto');
  END IF;

  SELECT ruta INTO v_ruta FROM imagen WHERE id_imagen = p_id_imagen;

  -- Eliminar vínculo (CASCADE debería bastar, pero lo hacemos explícito)
  DELETE FROM proyecto_imagen WHERE id_imagen = p_id_imagen AND id_proyecto = p_id_proyecto;
  DELETE FROM imagen WHERE id_imagen = p_id_imagen;

  -- Reordenar las imágenes restantes para cerrar huecos
  UPDATE proyecto_imagen pi2
  SET    orden = sub.nuevo_orden
  FROM (
    SELECT id_imagen,
           ROW_NUMBER() OVER (ORDER BY orden) AS nuevo_orden
    FROM   proyecto_imagen
    WHERE  id_proyecto = p_id_proyecto
  ) sub
  WHERE pi2.id_imagen   = sub.id_imagen
    AND pi2.id_proyecto = p_id_proyecto;

  RETURN jsonb_build_object(
    'ok',     TRUE,
    'mensaje','Imagen eliminada correctamente',
    'ruta',   v_ruta   -- Laravel la necesita para borrar el archivo físico
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;


-- ------------------------------------------------------------
-- 24. sp_sincronizar_habilidades_proyecto
--     Reemplaza los chips de habilidades técnicas de un proyecto.
--     Se llama al guardar/editar el proyecto desde ProyectoForm.jsx.
--     p_ids_habilidades: array JSON de enteros [1, 4, 7, ...]
--
--     Llamada Laravel:
--       DB::select("SELECT sp_sincronizar_habilidades_proyecto(?,?,?::jsonb)",
--                  [$idProyecto, $idUsuario, json_encode($idsArray)]);
-- ------------------------------------------------------------
/*CREATE OR REPLACE FUNCTION sp_sincronizar_habilidades_proyecto(
  p_id_proyecto     INT,
  p_id_usuario      INT,
  p_ids_habilidades JSONB    -- [1, 4, 7]  array de id_habilidad
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_hab  INT;
  v_nombres TEXT[] := '{}';
  v_nombre  VARCHAR(80);
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM proyecto
    WHERE id_proyecto = p_id_proyecto AND id_usuario = p_id_usuario
  ) THEN
    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'PROYECTO_NO_ENCONTRADO',
                              'mensaje', 'El proyecto no existe o no te pertenece');
  END IF;

  -- Eliminar habilidades actuales del proyecto
  DELETE FROM proyecto_habilidad WHERE id_proyecto = p_id_proyecto;

  -- Reinsertar las nuevas (solo técnicas)
  FOR v_id_hab IN SELECT value::INT FROM jsonb_array_elements_text(p_ids_habilidades)
  LOOP
    SELECT nombre INTO v_nombre
    FROM   habilidad
    WHERE  id_habilidad = v_id_hab AND tipo = 'tecnica';

    CONTINUE WHEN v_nombre IS NULL;

    INSERT INTO proyecto_habilidad (id_proyecto, id_habilidad)
    VALUES (p_id_proyecto, v_id_hab)
    ON CONFLICT DO NOTHING;

    v_nombres := array_append(v_nombres, v_nombre);
  END LOOP;

  RETURN jsonb_build_object(
    'ok',         TRUE,
    'mensaje',    'Habilidades del proyecto sincronizadas',
    'habilidades', to_jsonb(v_nombres)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);
END;
$$;*/

-- ============================================================
-- FIN DE PROCEDIMIENTOS ALMACENADOS
-- ============================================================