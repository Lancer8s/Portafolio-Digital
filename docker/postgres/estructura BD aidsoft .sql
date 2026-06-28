--
-- PostgreSQL database dump
--

-- Dumped from database version 15.12 (Debian 15.12-0+deb12u2)
-- Dumped by pg_dump version 15.12 (Debian 15.12-0+deb12u2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: aidsoft
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO aidsoft;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: aidsoft
--

COMMENT ON SCHEMA public IS '';


--
-- Name: fn_audit_proyecto(); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.fn_audit_proyecto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

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

$$;


ALTER FUNCTION public.fn_audit_proyecto() OWNER TO aidsoft;

--
-- Name: fn_audit_rol_usuario(); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.fn_audit_rol_usuario() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

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

$$;


ALTER FUNCTION public.fn_audit_rol_usuario() OWNER TO aidsoft;

--
-- Name: fn_audit_usuario(); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.fn_audit_usuario() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

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

$$;


ALTER FUNCTION public.fn_audit_usuario() OWNER TO aidsoft;

--
-- Name: fn_audit_usuario_habilidad(); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.fn_audit_usuario_habilidad() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

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

$$;


ALTER FUNCTION public.fn_audit_usuario_habilidad() OWNER TO aidsoft;

--
-- Name: fn_usuario_sesion(); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.fn_usuario_sesion() RETURNS integer
    LANGUAGE plpgsql
    AS $$

BEGIN

  RETURN NULLIF(current_setting('app.usuario_actual', TRUE), '')::INT;

EXCEPTION WHEN OTHERS THEN

  RETURN NULL;

END;

$$;


ALTER FUNCTION public.fn_usuario_sesion() OWNER TO aidsoft;

--
-- Name: sp_actualizar_foto_perfil(integer, character varying, character varying, character varying, integer, character varying); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_actualizar_foto_perfil(p_id_usuario integer, p_ruta character varying, p_nombre character varying DEFAULT NULL::character varying, p_tipo character varying DEFAULT NULL::character varying, p_tamanio_kb integer DEFAULT NULL::integer, p_contexto character varying DEFAULT 'perfil'::character varying) RETURNS jsonb
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


ALTER FUNCTION public.sp_actualizar_foto_perfil(p_id_usuario integer, p_ruta character varying, p_nombre character varying, p_tipo character varying, p_tamanio_kb integer, p_contexto character varying) OWNER TO aidsoft;

--
-- Name: sp_actualizar_perfil_usuario(integer, character varying, character varying, character varying, text, character varying, character varying, character varying, character varying, jsonb, character varying); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_actualizar_perfil_usuario(p_id_usuario integer, p_nombre character varying DEFAULT NULL::character varying, p_apellido character varying DEFAULT NULL::character varying, p_profesion character varying DEFAULT NULL::character varying, p_biografia text DEFAULT NULL::text, p_titulo_profesional character varying DEFAULT NULL::character varying, p_linkedin_url character varying DEFAULT NULL::character varying, p_github_url character varying DEFAULT NULL::character varying, p_visibilidad character varying DEFAULT NULL::character varying, p_redes_sociales jsonb DEFAULT NULL::jsonb, p_telefono character varying DEFAULT NULL::character varying) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$

DECLARE

  v_nuevo JSONB;

BEGIN

  IF NOT EXISTS (SELECT 1 FROM usuario WHERE id_usuario = p_id_usuario) THEN

    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'USUARIO_NO_ENCONTRADO', 'mensaje', 'El usuario no existe');

  END IF;

  PERFORM set_config('app.usuario_actual', p_id_usuario::TEXT, TRUE);

  UPDATE usuario SET

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

    'nombre', nombre, 'apellido', apellido, 'profesion', profesion,

    'biografia', biografia, 'titulo_profesional', titulo_profesional,

    'linkedin_url', linkedin_url, 'github_url', github_url,

    'visibilidad', visibilidad, 'redes_sociales', redes_sociales,

    'nombre_modificado', nombre_modificado, 'telefono', telefono

  ) INTO v_nuevo;

  RETURN jsonb_build_object('ok', TRUE, 'mensaje', 'Perfil actualizado correctamente', 'perfil', v_nuevo);

EXCEPTION WHEN OTHERS THEN

  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);

END; $$;


ALTER FUNCTION public.sp_actualizar_perfil_usuario(p_id_usuario integer, p_nombre character varying, p_apellido character varying, p_profesion character varying, p_biografia text, p_titulo_profesional character varying, p_linkedin_url character varying, p_github_url character varying, p_visibilidad character varying, p_redes_sociales jsonb, p_telefono character varying) OWNER TO aidsoft;

--
-- Name: sp_actualizar_proyecto(integer, integer, character varying, text, character varying); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_actualizar_proyecto(p_id_proyecto integer, p_id_usuario integer, p_nombre character varying DEFAULT NULL::character varying, p_descripcion text DEFAULT NULL::text, p_url_repo character varying DEFAULT NULL::character varying) RETURNS jsonb
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

  -- Validar URL GitHub si se envía

  IF p_url_repo IS NOT NULL AND TRIM(p_url_repo) != '' THEN

    IF NOT (TRIM(p_url_repo) ~ '^https://(www\.)?github\.com/[^/]+/[^/]+') THEN

      RETURN jsonb_build_object('ok', FALSE, 'codigo', 'URL_INVALIDA',

                                'mensaje', 'El enlace debe ser un repositorio válido de GitHub');

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


ALTER FUNCTION public.sp_actualizar_proyecto(p_id_proyecto integer, p_id_usuario integer, p_nombre character varying, p_descripcion text, p_url_repo character varying) OWNER TO aidsoft;

--
-- Name: sp_agregar_habilidad_personalizada(integer, character varying, character varying, smallint); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_agregar_habilidad_personalizada(p_id_usuario integer, p_nombre character varying, p_tipo character varying, p_nivel smallint DEFAULT NULL::smallint) RETURNS jsonb
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


ALTER FUNCTION public.sp_agregar_habilidad_personalizada(p_id_usuario integer, p_nombre character varying, p_tipo character varying, p_nivel smallint) OWNER TO aidsoft;

--
-- Name: sp_agregar_habilidad_usuario(integer, integer, smallint); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_agregar_habilidad_usuario(p_id_usuario integer, p_id_habilidad integer, p_nivel smallint DEFAULT NULL::smallint) RETURNS jsonb
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


ALTER FUNCTION public.sp_agregar_habilidad_usuario(p_id_usuario integer, p_id_habilidad integer, p_nivel smallint) OWNER TO aidsoft;

--
-- Name: sp_agregar_imagen_proyecto(integer, integer, character varying, character varying, character varying, integer); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_agregar_imagen_proyecto(p_id_proyecto integer, p_id_usuario integer, p_ruta character varying, p_nombre character varying DEFAULT NULL::character varying, p_tipo character varying DEFAULT NULL::character varying, p_tamanio_kb integer DEFAULT NULL::integer) RETURNS jsonb
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


ALTER FUNCTION public.sp_agregar_imagen_proyecto(p_id_proyecto integer, p_id_usuario integer, p_ruta character varying, p_nombre character varying, p_tipo character varying, p_tamanio_kb integer) OWNER TO aidsoft;

--
-- Name: sp_buscar_por_github(character varying); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_buscar_por_github(p_github_id character varying) RETURNS jsonb
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


ALTER FUNCTION public.sp_buscar_por_github(p_github_id character varying) OWNER TO aidsoft;

--
-- Name: sp_cambiar_password(integer, character varying); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_cambiar_password(p_id_usuario integer, p_nuevo_password_hash character varying) RETURNS jsonb
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


ALTER FUNCTION public.sp_cambiar_password(p_id_usuario integer, p_nuevo_password_hash character varying) OWNER TO aidsoft;

--
-- Name: sp_crear_proyecto(integer, character varying, text, character varying); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_crear_proyecto(p_id_usuario integer, p_nombre character varying, p_descripcion text DEFAULT NULL::text, p_url_repo character varying DEFAULT NULL::character varying) RETURNS jsonb
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


ALTER FUNCTION public.sp_crear_proyecto(p_id_usuario integer, p_nombre character varying, p_descripcion text, p_url_repo character varying) OWNER TO aidsoft;

--
-- Name: sp_desactivar_usuario(integer); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_desactivar_usuario(p_id_usuario integer) RETURNS jsonb
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


ALTER FUNCTION public.sp_desactivar_usuario(p_id_usuario integer) OWNER TO aidsoft;

--
-- Name: sp_editar_nivel_habilidad(integer, integer, smallint); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_editar_nivel_habilidad(p_id_usuario integer, p_id_habilidad integer, p_nuevo_nivel smallint) RETURNS jsonb
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


ALTER FUNCTION public.sp_editar_nivel_habilidad(p_id_usuario integer, p_id_habilidad integer, p_nuevo_nivel smallint) OWNER TO aidsoft;

--
-- Name: sp_eliminar_habilidad_usuario(integer, integer); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_eliminar_habilidad_usuario(p_id_usuario integer, p_id_habilidad integer) RETURNS jsonb
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


ALTER FUNCTION public.sp_eliminar_habilidad_usuario(p_id_usuario integer, p_id_habilidad integer) OWNER TO aidsoft;

--
-- Name: sp_eliminar_imagen_proyecto(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_eliminar_imagen_proyecto(p_id_imagen integer, p_id_proyecto integer, p_id_usuario integer) RETURNS jsonb
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


ALTER FUNCTION public.sp_eliminar_imagen_proyecto(p_id_imagen integer, p_id_proyecto integer, p_id_usuario integer) OWNER TO aidsoft;

--
-- Name: sp_eliminar_proyecto(integer, integer); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_eliminar_proyecto(p_id_proyecto integer, p_id_usuario integer) RETURNS jsonb
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


ALTER FUNCTION public.sp_eliminar_proyecto(p_id_proyecto integer, p_id_usuario integer) OWNER TO aidsoft;

--
-- Name: sp_listar_catalogo_habilidades(); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_listar_catalogo_habilidades() RETURNS jsonb
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


ALTER FUNCTION public.sp_listar_catalogo_habilidades() OWNER TO aidsoft;

--
-- Name: sp_listar_habilidades_usuario(integer); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_listar_habilidades_usuario(p_id_usuario integer) RETURNS jsonb
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


ALTER FUNCTION public.sp_listar_habilidades_usuario(p_id_usuario integer) OWNER TO aidsoft;

--
-- Name: sp_listar_proyectos_usuario(integer); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_listar_proyectos_usuario(p_id_usuario integer) RETURNS jsonb
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


ALTER FUNCTION public.sp_listar_proyectos_usuario(p_id_usuario integer) OWNER TO aidsoft;

--
-- Name: sp_login_usuario(character varying); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_login_usuario(p_email character varying) RETURNS jsonb
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


ALTER FUNCTION public.sp_login_usuario(p_email character varying) OWNER TO aidsoft;

--
-- Name: sp_obtener_perfil_usuario(integer); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_obtener_perfil_usuario(p_id_usuario integer) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$

DECLARE

  v_perfil JSONB; v_foto TEXT; v_roles JSONB; v_stats JSONB;

BEGIN

  SELECT to_jsonb(sub) INTO v_perfil FROM (

    SELECT nombre, apellido, email, profesion, biografia, activo,

           fecha_registro, id_imagen, titulo_profesional, linkedin_url,

           github_url, visibilidad, nombre_modificado, redes_sociales,

           ci_estado, id_imagen_ci, telefono

    FROM usuario WHERE id_usuario = p_id_usuario

  ) sub;

  IF v_perfil IS NULL THEN

    RETURN jsonb_build_object('ok', FALSE, 'codigo', 'USUARIO_NO_ENCONTRADO', 'mensaje', 'El usuario no existe');

  END IF;

  IF (v_perfil->>'id_imagen') IS NOT NULL THEN

    SELECT ruta INTO v_foto FROM imagen WHERE id_imagen = (v_perfil->>'id_imagen')::INT;

  END IF;

  SELECT jsonb_agg(r.nombre) INTO v_roles FROM rol_usuario ru JOIN rol r ON r.id_rol = ru.id_rol WHERE ru.id_usuario = p_id_usuario;

  SELECT jsonb_build_object(

    'total_habilidades_tecnicas', (SELECT COUNT(*) FROM usuario_habilidad uh JOIN habilidad h ON h.id_habilidad = uh.id_habilidad WHERE uh.id_usuario = p_id_usuario AND h.tipo = 'tecnica'),

    'total_habilidades_blandas', (SELECT COUNT(*) FROM usuario_habilidad uh JOIN habilidad h ON h.id_habilidad = uh.id_habilidad WHERE uh.id_usuario = p_id_usuario AND h.tipo = 'blanda'),

    'total_proyectos', (SELECT COUNT(*) FROM proyecto WHERE id_usuario = p_id_usuario),

    'nivel_promedio_tecnico', (SELECT ROUND(AVG(uh.nivel)) FROM usuario_habilidad uh JOIN habilidad h ON h.id_habilidad = uh.id_habilidad WHERE uh.id_usuario = p_id_usuario AND h.tipo = 'tecnica')

  ) INTO v_stats;

  RETURN jsonb_build_object('ok', TRUE, 'perfil', jsonb_build_object(

    'id_usuario', p_id_usuario, 'nombre', v_perfil->>'nombre', 'apellido', v_perfil->>'apellido',

    'email', v_perfil->>'email', 'profesion', v_perfil->>'profesion', 'biografia', v_perfil->>'biografia',

    'titulo_profesional', v_perfil->>'titulo_profesional', 'linkedin_url', v_perfil->>'linkedin_url',

    'github_url', v_perfil->>'github_url', 'redes_sociales', COALESCE(v_perfil->'redes_sociales', '[]'::jsonb),

    'visibilidad', v_perfil->>'visibilidad', 'nombre_modificado', (v_perfil->>'nombre_modificado')::BOOLEAN,

    'foto_url', v_foto, 'ci_estado', v_perfil->>'ci_estado', 'telefono', v_perfil->>'telefono',

    'activo', (v_perfil->>'activo')::BOOLEAN, 'fecha_registro', v_perfil->>'fecha_registro',

    'roles', COALESCE(v_roles, '[]'::JSONB), 'estadisticas', v_stats

  ));

EXCEPTION WHEN OTHERS THEN

  RETURN jsonb_build_object('ok', FALSE, 'codigo', 'ERROR_INTERNO', 'mensaje', SQLERRM);

END; $$;


ALTER FUNCTION public.sp_obtener_perfil_usuario(p_id_usuario integer) OWNER TO aidsoft;

--
-- Name: sp_obtener_proyecto(integer, integer); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_obtener_proyecto(p_id_proyecto integer, p_id_usuario integer) RETURNS jsonb
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


ALTER FUNCTION public.sp_obtener_proyecto(p_id_proyecto integer, p_id_usuario integer) OWNER TO aidsoft;

--
-- Name: sp_registrar_usuario(character varying, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_registrar_usuario(p_nombre character varying, p_apellido character varying, p_email character varying, p_password_hash character varying) RETURNS jsonb
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


ALTER FUNCTION public.sp_registrar_usuario(p_nombre character varying, p_apellido character varying, p_email character varying, p_password_hash character varying) OWNER TO aidsoft;

--
-- Name: sp_sincronizar_habilidades(integer, character varying, jsonb); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_sincronizar_habilidades(p_id_usuario integer, p_tipo character varying, p_habilidades jsonb) RETURNS jsonb
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


ALTER FUNCTION public.sp_sincronizar_habilidades(p_id_usuario integer, p_tipo character varying, p_habilidades jsonb) OWNER TO aidsoft;

--
-- Name: sp_sincronizar_habilidades_proyecto(integer, integer, jsonb); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_sincronizar_habilidades_proyecto(p_id_proyecto integer, p_id_usuario integer, p_ids_habilidades jsonb) RETURNS jsonb
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


ALTER FUNCTION public.sp_sincronizar_habilidades_proyecto(p_id_proyecto integer, p_id_usuario integer, p_ids_habilidades jsonb) OWNER TO aidsoft;

--
-- Name: sp_vincular_github(integer, character varying, text, text); Type: FUNCTION; Schema: public; Owner: aidsoft
--

CREATE FUNCTION public.sp_vincular_github(p_id_usuario integer, p_github_id character varying, p_access_token text DEFAULT NULL::text, p_refresh_token text DEFAULT NULL::text) RETURNS jsonb
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


ALTER FUNCTION public.sp_vincular_github(p_id_usuario integer, p_github_id character varying, p_access_token text, p_refresh_token text) OWNER TO aidsoft;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bitacora_proyecto; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.bitacora_proyecto (
    id_bitacora integer NOT NULL,
    id_usuario_accion integer,
    accion character varying(10),
    descripcion character varying(255),
    valor_anterior jsonb,
    valor_nuevo jsonb,
    fecha date DEFAULT CURRENT_DATE,
    hora time without time zone DEFAULT CURRENT_TIME,
    CONSTRAINT bitacora_proyecto_accion_check CHECK (((accion)::text = ANY ((ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying])::text[])))
);


ALTER TABLE public.bitacora_proyecto OWNER TO aidsoft;

--
-- Name: bitacora_proyecto_id_bitacora_seq; Type: SEQUENCE; Schema: public; Owner: aidsoft
--

CREATE SEQUENCE public.bitacora_proyecto_id_bitacora_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bitacora_proyecto_id_bitacora_seq OWNER TO aidsoft;

--
-- Name: bitacora_proyecto_id_bitacora_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aidsoft
--

ALTER SEQUENCE public.bitacora_proyecto_id_bitacora_seq OWNED BY public.bitacora_proyecto.id_bitacora;


--
-- Name: bitacora_rol_usuario; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.bitacora_rol_usuario (
    id_bitacora integer NOT NULL,
    id_usuario_accion integer,
    accion character varying(10),
    descripcion character varying(255),
    valor_anterior jsonb,
    valor_nuevo jsonb,
    fecha date DEFAULT CURRENT_DATE,
    hora time without time zone DEFAULT CURRENT_TIME,
    CONSTRAINT bitacora_rol_usuario_accion_check CHECK (((accion)::text = ANY ((ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying])::text[])))
);


ALTER TABLE public.bitacora_rol_usuario OWNER TO aidsoft;

--
-- Name: bitacora_rol_usuario_id_bitacora_seq; Type: SEQUENCE; Schema: public; Owner: aidsoft
--

CREATE SEQUENCE public.bitacora_rol_usuario_id_bitacora_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bitacora_rol_usuario_id_bitacora_seq OWNER TO aidsoft;

--
-- Name: bitacora_rol_usuario_id_bitacora_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aidsoft
--

ALTER SEQUENCE public.bitacora_rol_usuario_id_bitacora_seq OWNED BY public.bitacora_rol_usuario.id_bitacora;


--
-- Name: bitacora_usuario; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.bitacora_usuario (
    id_bitacora integer NOT NULL,
    id_usuario_accion integer,
    accion character varying(10),
    descripcion character varying(255),
    valor_anterior jsonb,
    valor_nuevo jsonb,
    fecha date DEFAULT CURRENT_DATE,
    hora time without time zone DEFAULT CURRENT_TIME,
    CONSTRAINT bitacora_usuario_accion_check CHECK (((accion)::text = ANY ((ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying])::text[])))
);


ALTER TABLE public.bitacora_usuario OWNER TO aidsoft;

--
-- Name: bitacora_usuario_habilidad; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.bitacora_usuario_habilidad (
    id_bitacora integer NOT NULL,
    id_usuario_accion integer,
    accion character varying(10),
    descripcion character varying(255),
    valor_anterior jsonb,
    valor_nuevo jsonb,
    fecha date DEFAULT CURRENT_DATE,
    hora time without time zone DEFAULT CURRENT_TIME,
    CONSTRAINT bitacora_usuario_habilidad_accion_check CHECK (((accion)::text = ANY ((ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying])::text[])))
);


ALTER TABLE public.bitacora_usuario_habilidad OWNER TO aidsoft;

--
-- Name: bitacora_usuario_habilidad_id_bitacora_seq; Type: SEQUENCE; Schema: public; Owner: aidsoft
--

CREATE SEQUENCE public.bitacora_usuario_habilidad_id_bitacora_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bitacora_usuario_habilidad_id_bitacora_seq OWNER TO aidsoft;

--
-- Name: bitacora_usuario_habilidad_id_bitacora_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aidsoft
--

ALTER SEQUENCE public.bitacora_usuario_habilidad_id_bitacora_seq OWNED BY public.bitacora_usuario_habilidad.id_bitacora;


--
-- Name: bitacora_usuario_id_bitacora_seq; Type: SEQUENCE; Schema: public; Owner: aidsoft
--

CREATE SEQUENCE public.bitacora_usuario_id_bitacora_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bitacora_usuario_id_bitacora_seq OWNER TO aidsoft;

--
-- Name: bitacora_usuario_id_bitacora_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aidsoft
--

ALTER SEQUENCE public.bitacora_usuario_id_bitacora_seq OWNED BY public.bitacora_usuario.id_bitacora;


--
-- Name: certificaciones; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.certificaciones (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    titulo character varying(150) NOT NULL,
    institucion character varying(150) NOT NULL,
    fecha_emision date NOT NULL,
    descripcion character varying(500),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.certificaciones OWNER TO aidsoft;

--
-- Name: certificaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: aidsoft
--

CREATE SEQUENCE public.certificaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.certificaciones_id_seq OWNER TO aidsoft;

--
-- Name: certificaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aidsoft
--

ALTER SEQUENCE public.certificaciones_id_seq OWNED BY public.certificaciones.id;


--
-- Name: experiencia; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.experiencia (
    id_experiencia integer NOT NULL,
    id_usuario integer NOT NULL,
    tipo character varying(20) NOT NULL,
    institucion_empresa character varying(150) NOT NULL,
    cargo_titulo character varying(150) NOT NULL,
    fecha_inicio date,
    fecha_fin date,
    descripcion text,
    fecha_registro timestamp without time zone DEFAULT now() NOT NULL,
    nivel_academico character varying(50) DEFAULT NULL::character varying,
    referencias text,
    url_certificado character varying(255) DEFAULT NULL::character varying,
    CONSTRAINT experiencia_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['laboral'::character varying, 'academica'::character varying])::text[])))
);


ALTER TABLE public.experiencia OWNER TO aidsoft;

--
-- Name: experiencia_id_experiencia_seq; Type: SEQUENCE; Schema: public; Owner: aidsoft
--

CREATE SEQUENCE public.experiencia_id_experiencia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.experiencia_id_experiencia_seq OWNER TO aidsoft;

--
-- Name: experiencia_id_experiencia_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aidsoft
--

ALTER SEQUENCE public.experiencia_id_experiencia_seq OWNED BY public.experiencia.id_experiencia;


--
-- Name: habilidad; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.habilidad (
    id_habilidad integer NOT NULL,
    nombre character varying(80) NOT NULL,
    tipo character varying(10) NOT NULL,
    categoria character varying(50),
    descripcion text,
    CONSTRAINT habilidad_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['tecnica'::character varying, 'blanda'::character varying])::text[])))
);


ALTER TABLE public.habilidad OWNER TO aidsoft;

--
-- Name: habilidad_id_habilidad_seq; Type: SEQUENCE; Schema: public; Owner: aidsoft
--

CREATE SEQUENCE public.habilidad_id_habilidad_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.habilidad_id_habilidad_seq OWNER TO aidsoft;

--
-- Name: habilidad_id_habilidad_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aidsoft
--

ALTER SEQUENCE public.habilidad_id_habilidad_seq OWNED BY public.habilidad.id_habilidad;


--
-- Name: imagen; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.imagen (
    id_imagen integer NOT NULL,
    ruta character varying(300) NOT NULL,
    nombre character varying(150),
    tipo character varying(20),
    tamanio_kb integer,
    contexto character varying(20) DEFAULT 'perfil'::character varying NOT NULL,
    fecha_subida timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT imagen_contexto_check CHECK (((contexto)::text = ANY ((ARRAY['perfil'::character varying, 'proyecto'::character varying])::text[])))
);


ALTER TABLE public.imagen OWNER TO aidsoft;

--
-- Name: imagen_id_imagen_seq; Type: SEQUENCE; Schema: public; Owner: aidsoft
--

CREATE SEQUENCE public.imagen_id_imagen_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.imagen_id_imagen_seq OWNER TO aidsoft;

--
-- Name: imagen_id_imagen_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aidsoft
--

ALTER SEQUENCE public.imagen_id_imagen_seq OWNED BY public.imagen.id_imagen;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


ALTER TABLE public.migrations OWNER TO aidsoft;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: aidsoft
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migrations_id_seq OWNER TO aidsoft;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aidsoft
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: oauth_account; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.oauth_account (
    id_oauth integer NOT NULL,
    id_usuario integer NOT NULL,
    provider character varying(30) NOT NULL,
    provider_user_id character varying(100) NOT NULL,
    access_token text,
    refresh_token text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.oauth_account OWNER TO aidsoft;

--
-- Name: oauth_account_id_oauth_seq; Type: SEQUENCE; Schema: public; Owner: aidsoft
--

CREATE SEQUENCE public.oauth_account_id_oauth_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.oauth_account_id_oauth_seq OWNER TO aidsoft;

--
-- Name: oauth_account_id_oauth_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aidsoft
--

ALTER SEQUENCE public.oauth_account_id_oauth_seq OWNED BY public.oauth_account.id_oauth;


--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp without time zone,
    expires_at timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.personal_access_tokens OWNER TO aidsoft;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: aidsoft
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.personal_access_tokens_id_seq OWNER TO aidsoft;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aidsoft
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: proyecto; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.proyecto (
    id_proyecto integer NOT NULL,
    id_usuario integer NOT NULL,
    nombre character varying(150) NOT NULL,
    descripcion text,
    url_repositorio character varying(300),
    fecha_creacion timestamp without time zone DEFAULT now() NOT NULL,
    estado character varying(20) DEFAULT 'en_desarrollo'::character varying NOT NULL,
    visible_portafolio boolean DEFAULT false NOT NULL,
    CONSTRAINT proyecto_estado_check CHECK (((estado)::text = ANY ((ARRAY['planificado'::character varying, 'en_desarrollo'::character varying, 'completado'::character varying, 'pausado'::character varying])::text[])))
);


ALTER TABLE public.proyecto OWNER TO aidsoft;

--
-- Name: proyecto_habilidad; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.proyecto_habilidad (
    id_proyecto integer NOT NULL,
    id_habilidad integer NOT NULL
);


ALTER TABLE public.proyecto_habilidad OWNER TO aidsoft;

--
-- Name: proyecto_id_proyecto_seq; Type: SEQUENCE; Schema: public; Owner: aidsoft
--

CREATE SEQUENCE public.proyecto_id_proyecto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.proyecto_id_proyecto_seq OWNER TO aidsoft;

--
-- Name: proyecto_id_proyecto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aidsoft
--

ALTER SEQUENCE public.proyecto_id_proyecto_seq OWNED BY public.proyecto.id_proyecto;


--
-- Name: proyecto_imagen; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.proyecto_imagen (
    id_proyecto integer NOT NULL,
    id_imagen integer NOT NULL,
    orden smallint DEFAULT 1 NOT NULL,
    CONSTRAINT proyecto_imagen_orden_check CHECK (((orden >= 1) AND (orden <= 6)))
);


ALTER TABLE public.proyecto_imagen OWNER TO aidsoft;

--
-- Name: rol; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.rol (
    id_rol integer NOT NULL,
    nombre character varying(30) NOT NULL,
    descripcion character varying(200)
);


ALTER TABLE public.rol OWNER TO aidsoft;

--
-- Name: rol_id_rol_seq; Type: SEQUENCE; Schema: public; Owner: aidsoft
--

CREATE SEQUENCE public.rol_id_rol_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rol_id_rol_seq OWNER TO aidsoft;

--
-- Name: rol_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aidsoft
--

ALTER SEQUENCE public.rol_id_rol_seq OWNED BY public.rol.id_rol;


--
-- Name: rol_usuario; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.rol_usuario (
    id_rol integer NOT NULL,
    id_usuario integer NOT NULL
);


ALTER TABLE public.rol_usuario OWNER TO aidsoft;

--
-- Name: usuario; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.usuario (
    id_usuario integer NOT NULL,
    nombre character varying(80) NOT NULL,
    apellido character varying(80) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    profesion character varying(120),
    titulo_profesional character varying(150),
    biografia text,
    id_imagen integer,
    nombre_modificado boolean DEFAULT false NOT NULL,
    id_imagen_ci integer,
    ci_estado character varying(50) DEFAULT NULL::character varying,
    linkedin_url character varying(300),
    github_url character varying(300),
    telefono character varying(50),
    redes_sociales jsonb DEFAULT '[]'::jsonb,
    visibilidad character varying(20) DEFAULT 'publico'::character varying NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    fecha_registro timestamp without time zone DEFAULT now() NOT NULL,
    motivo_rechazo_ci text,
    CONSTRAINT usuario_visibilidad_check CHECK (((visibilidad)::text = ANY ((ARRAY['publico'::character varying, 'privado'::character varying])::text[])))
);


ALTER TABLE public.usuario OWNER TO aidsoft;

--
-- Name: usuario_habilidad; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.usuario_habilidad (
    id_usuario integer NOT NULL,
    id_habilidad integer NOT NULL,
    nivel smallint,
    descripcion text,
    CONSTRAINT usuario_habilidad_nivel_check CHECK (((nivel IS NULL) OR ((nivel >= 0) AND (nivel <= 100))))
);


ALTER TABLE public.usuario_habilidad OWNER TO aidsoft;

--
-- Name: usuario_habilidad_personalizada; Type: TABLE; Schema: public; Owner: aidsoft
--

CREATE TABLE public.usuario_habilidad_personalizada (
    id_usuario integer NOT NULL,
    id_habilidad integer NOT NULL
);


ALTER TABLE public.usuario_habilidad_personalizada OWNER TO aidsoft;

--
-- Name: usuario_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: aidsoft
--

CREATE SEQUENCE public.usuario_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.usuario_id_usuario_seq OWNER TO aidsoft;

--
-- Name: usuario_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aidsoft
--

ALTER SEQUENCE public.usuario_id_usuario_seq OWNED BY public.usuario.id_usuario;


--
-- Name: v_estadisticas_admin; Type: VIEW; Schema: public; Owner: aidsoft
--

CREATE VIEW public.v_estadisticas_admin AS
 SELECT ( SELECT count(*) AS count
           FROM public.usuario) AS total_usuarios,
    ( SELECT count(*) AS count
           FROM public.usuario
          WHERE (usuario.activo = true)) AS usuarios_activos,
    ( SELECT count(*) AS count
           FROM public.proyecto) AS total_proyectos,
    ( SELECT count(*) AS count
           FROM public.proyecto
          WHERE ((proyecto.estado)::text = 'completado'::text)) AS proyectos_completados,
    ( SELECT count(*) AS count
           FROM public.usuario_habilidad) AS habilidades_registradas,
    ( SELECT count(*) AS count
           FROM public.habilidad
          WHERE ((habilidad.tipo)::text = 'tecnica'::text)) AS habilidades_tecnicas_catalogo,
    ( SELECT count(*) AS count
           FROM public.habilidad
          WHERE ((habilidad.tipo)::text = 'blanda'::text)) AS habilidades_blandas_catalogo;


ALTER TABLE public.v_estadisticas_admin OWNER TO aidsoft;

--
-- Name: v_habilidades_usuario; Type: VIEW; Schema: public; Owner: aidsoft
--

CREATE VIEW public.v_habilidades_usuario AS
 SELECT uh.id_usuario,
    h.id_habilidad,
    h.nombre,
    h.tipo,
    h.categoria,
    uh.nivel,
    uh.descripcion
   FROM (public.usuario_habilidad uh
     JOIN public.habilidad h ON ((h.id_habilidad = uh.id_habilidad)))
  ORDER BY h.tipo, h.categoria, h.nombre;


ALTER TABLE public.v_habilidades_usuario OWNER TO aidsoft;

--
-- Name: v_portafolio_publico; Type: VIEW; Schema: public; Owner: aidsoft
--

CREATE VIEW public.v_portafolio_publico AS
 SELECT u.id_usuario,
    (((u.nombre)::text || ' '::text) || (u.apellido)::text) AS nombre_completo,
    u.profesion,
    u.titulo_profesional,
    u.biografia,
    u.linkedin_url,
    u.github_url,
    u.visibilidad,
    i.ruta AS foto_url
   FROM (public.usuario u
     LEFT JOIN public.imagen i ON ((i.id_imagen = u.id_imagen)))
  WHERE (u.activo = true);


ALTER TABLE public.v_portafolio_publico OWNER TO aidsoft;

--
-- Name: v_proyectos_usuario; Type: VIEW; Schema: public; Owner: aidsoft
--

CREATE VIEW public.v_proyectos_usuario AS
SELECT
    NULL::integer AS id_proyecto,
    NULL::integer AS id_usuario,
    NULL::character varying(150) AS nombre,
    NULL::text AS descripcion,
    NULL::character varying(300) AS url_repositorio,
    NULL::timestamp without time zone AS fecha_creacion,
    NULL::character varying(20) AS estado,
    NULL::boolean AS visible_portafolio,
    NULL::bigint AS total_imagenes,
    NULL::bigint AS total_habilidades;


ALTER TABLE public.v_proyectos_usuario OWNER TO aidsoft;

--
-- Name: bitacora_proyecto id_bitacora; Type: DEFAULT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.bitacora_proyecto ALTER COLUMN id_bitacora SET DEFAULT nextval('public.bitacora_proyecto_id_bitacora_seq'::regclass);


--
-- Name: bitacora_rol_usuario id_bitacora; Type: DEFAULT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.bitacora_rol_usuario ALTER COLUMN id_bitacora SET DEFAULT nextval('public.bitacora_rol_usuario_id_bitacora_seq'::regclass);


--
-- Name: bitacora_usuario id_bitacora; Type: DEFAULT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.bitacora_usuario ALTER COLUMN id_bitacora SET DEFAULT nextval('public.bitacora_usuario_id_bitacora_seq'::regclass);


--
-- Name: bitacora_usuario_habilidad id_bitacora; Type: DEFAULT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.bitacora_usuario_habilidad ALTER COLUMN id_bitacora SET DEFAULT nextval('public.bitacora_usuario_habilidad_id_bitacora_seq'::regclass);


--
-- Name: certificaciones id; Type: DEFAULT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.certificaciones ALTER COLUMN id SET DEFAULT nextval('public.certificaciones_id_seq'::regclass);


--
-- Name: experiencia id_experiencia; Type: DEFAULT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.experiencia ALTER COLUMN id_experiencia SET DEFAULT nextval('public.experiencia_id_experiencia_seq'::regclass);


--
-- Name: habilidad id_habilidad; Type: DEFAULT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.habilidad ALTER COLUMN id_habilidad SET DEFAULT nextval('public.habilidad_id_habilidad_seq'::regclass);


--
-- Name: imagen id_imagen; Type: DEFAULT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.imagen ALTER COLUMN id_imagen SET DEFAULT nextval('public.imagen_id_imagen_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: oauth_account id_oauth; Type: DEFAULT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.oauth_account ALTER COLUMN id_oauth SET DEFAULT nextval('public.oauth_account_id_oauth_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Name: proyecto id_proyecto; Type: DEFAULT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.proyecto ALTER COLUMN id_proyecto SET DEFAULT nextval('public.proyecto_id_proyecto_seq'::regclass);


--
-- Name: rol id_rol; Type: DEFAULT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.rol ALTER COLUMN id_rol SET DEFAULT nextval('public.rol_id_rol_seq'::regclass);


--
-- Name: usuario id_usuario; Type: DEFAULT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.usuario ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuario_id_usuario_seq'::regclass);


--
-- Name: bitacora_proyecto bitacora_proyecto_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.bitacora_proyecto
    ADD CONSTRAINT bitacora_proyecto_pkey PRIMARY KEY (id_bitacora);


--
-- Name: bitacora_rol_usuario bitacora_rol_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.bitacora_rol_usuario
    ADD CONSTRAINT bitacora_rol_usuario_pkey PRIMARY KEY (id_bitacora);


--
-- Name: bitacora_usuario_habilidad bitacora_usuario_habilidad_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.bitacora_usuario_habilidad
    ADD CONSTRAINT bitacora_usuario_habilidad_pkey PRIMARY KEY (id_bitacora);


--
-- Name: bitacora_usuario bitacora_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.bitacora_usuario
    ADD CONSTRAINT bitacora_usuario_pkey PRIMARY KEY (id_bitacora);


--
-- Name: certificaciones certificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.certificaciones
    ADD CONSTRAINT certificaciones_pkey PRIMARY KEY (id);


--
-- Name: experiencia experiencia_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.experiencia
    ADD CONSTRAINT experiencia_pkey PRIMARY KEY (id_experiencia);


--
-- Name: habilidad habilidad_nombre_key; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.habilidad
    ADD CONSTRAINT habilidad_nombre_key UNIQUE (nombre);


--
-- Name: habilidad habilidad_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.habilidad
    ADD CONSTRAINT habilidad_pkey PRIMARY KEY (id_habilidad);


--
-- Name: imagen imagen_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.imagen
    ADD CONSTRAINT imagen_pkey PRIMARY KEY (id_imagen);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: oauth_account oauth_account_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.oauth_account
    ADD CONSTRAINT oauth_account_pkey PRIMARY KEY (id_oauth);


--
-- Name: oauth_account oauth_account_provider_provider_user_id_key; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.oauth_account
    ADD CONSTRAINT oauth_account_provider_provider_user_id_key UNIQUE (provider, provider_user_id);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_key UNIQUE (token);


--
-- Name: proyecto_habilidad proyecto_habilidad_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.proyecto_habilidad
    ADD CONSTRAINT proyecto_habilidad_pkey PRIMARY KEY (id_proyecto, id_habilidad);


--
-- Name: proyecto_imagen proyecto_imagen_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.proyecto_imagen
    ADD CONSTRAINT proyecto_imagen_pkey PRIMARY KEY (id_proyecto, id_imagen);


--
-- Name: proyecto proyecto_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.proyecto
    ADD CONSTRAINT proyecto_pkey PRIMARY KEY (id_proyecto);


--
-- Name: rol rol_nombre_key; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_nombre_key UNIQUE (nombre);


--
-- Name: rol rol_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_pkey PRIMARY KEY (id_rol);


--
-- Name: rol_usuario rol_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.rol_usuario
    ADD CONSTRAINT rol_usuario_pkey PRIMARY KEY (id_rol, id_usuario);


--
-- Name: usuario usuario_email_key; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_email_key UNIQUE (email);


--
-- Name: usuario_habilidad_personalizada usuario_habilidad_personalizada_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.usuario_habilidad_personalizada
    ADD CONSTRAINT usuario_habilidad_personalizada_pkey PRIMARY KEY (id_usuario, id_habilidad);


--
-- Name: usuario_habilidad usuario_habilidad_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.usuario_habilidad
    ADD CONSTRAINT usuario_habilidad_pkey PRIMARY KEY (id_usuario, id_habilidad);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id_usuario);


--
-- Name: certificaciones_user_id_fecha_emision_index; Type: INDEX; Schema: public; Owner: aidsoft
--

CREATE INDEX certificaciones_user_id_fecha_emision_index ON public.certificaciones USING btree (user_id, fecha_emision);


--
-- Name: idx_bit_hab_fecha; Type: INDEX; Schema: public; Owner: aidsoft
--

CREATE INDEX idx_bit_hab_fecha ON public.bitacora_usuario_habilidad USING btree (fecha);


--
-- Name: idx_bit_proy_actor; Type: INDEX; Schema: public; Owner: aidsoft
--

CREATE INDEX idx_bit_proy_actor ON public.bitacora_proyecto USING btree (id_usuario_accion);


--
-- Name: idx_bit_proy_fecha; Type: INDEX; Schema: public; Owner: aidsoft
--

CREATE INDEX idx_bit_proy_fecha ON public.bitacora_proyecto USING btree (fecha);


--
-- Name: idx_bit_rol_fecha; Type: INDEX; Schema: public; Owner: aidsoft
--

CREATE INDEX idx_bit_rol_fecha ON public.bitacora_rol_usuario USING btree (fecha);


--
-- Name: idx_bit_usu_actor; Type: INDEX; Schema: public; Owner: aidsoft
--

CREATE INDEX idx_bit_usu_actor ON public.bitacora_usuario USING btree (id_usuario_accion);


--
-- Name: idx_bit_usu_fecha; Type: INDEX; Schema: public; Owner: aidsoft
--

CREATE INDEX idx_bit_usu_fecha ON public.bitacora_usuario USING btree (fecha);


--
-- Name: idx_habilidad_tipo; Type: INDEX; Schema: public; Owner: aidsoft
--

CREATE INDEX idx_habilidad_tipo ON public.habilidad USING btree (tipo);


--
-- Name: idx_ph_proyecto; Type: INDEX; Schema: public; Owner: aidsoft
--

CREATE INDEX idx_ph_proyecto ON public.proyecto_habilidad USING btree (id_proyecto);


--
-- Name: idx_pi_proyecto; Type: INDEX; Schema: public; Owner: aidsoft
--

CREATE INDEX idx_pi_proyecto ON public.proyecto_imagen USING btree (id_proyecto);


--
-- Name: idx_proyecto_usuario; Type: INDEX; Schema: public; Owner: aidsoft
--

CREATE INDEX idx_proyecto_usuario ON public.proyecto USING btree (id_usuario);


--
-- Name: idx_proyecto_visible; Type: INDEX; Schema: public; Owner: aidsoft
--

CREATE INDEX idx_proyecto_visible ON public.proyecto USING btree (visible_portafolio);


--
-- Name: idx_rol_usuario_u; Type: INDEX; Schema: public; Owner: aidsoft
--

CREATE INDEX idx_rol_usuario_u ON public.rol_usuario USING btree (id_usuario);


--
-- Name: idx_uh_habilidad; Type: INDEX; Schema: public; Owner: aidsoft
--

CREATE INDEX idx_uh_habilidad ON public.usuario_habilidad USING btree (id_habilidad);


--
-- Name: idx_uh_usuario; Type: INDEX; Schema: public; Owner: aidsoft
--

CREATE INDEX idx_uh_usuario ON public.usuario_habilidad USING btree (id_usuario);


--
-- Name: idx_usuario_activo; Type: INDEX; Schema: public; Owner: aidsoft
--

CREATE INDEX idx_usuario_activo ON public.usuario USING btree (activo);


--
-- Name: idx_usuario_email; Type: INDEX; Schema: public; Owner: aidsoft
--

CREATE INDEX idx_usuario_email ON public.usuario USING btree (email);


--
-- Name: v_proyectos_usuario _RETURN; Type: RULE; Schema: public; Owner: aidsoft
--

CREATE OR REPLACE VIEW public.v_proyectos_usuario AS
 SELECT p.id_proyecto,
    p.id_usuario,
    p.nombre,
    p.descripcion,
    p.url_repositorio,
    p.fecha_creacion,
    p.estado,
    p.visible_portafolio,
    count(DISTINCT pi2.id_imagen) AS total_imagenes,
    count(DISTINCT ph.id_habilidad) AS total_habilidades
   FROM ((public.proyecto p
     LEFT JOIN public.proyecto_imagen pi2 ON ((pi2.id_proyecto = p.id_proyecto)))
     LEFT JOIN public.proyecto_habilidad ph ON ((ph.id_proyecto = p.id_proyecto)))
  GROUP BY p.id_proyecto;


--
-- Name: proyecto trg_audit_proyecto; Type: TRIGGER; Schema: public; Owner: aidsoft
--

CREATE TRIGGER trg_audit_proyecto AFTER INSERT OR DELETE OR UPDATE ON public.proyecto FOR EACH ROW EXECUTE FUNCTION public.fn_audit_proyecto();


--
-- Name: rol_usuario trg_audit_rol_usuario; Type: TRIGGER; Schema: public; Owner: aidsoft
--

CREATE TRIGGER trg_audit_rol_usuario AFTER INSERT OR DELETE ON public.rol_usuario FOR EACH ROW EXECUTE FUNCTION public.fn_audit_rol_usuario();


--
-- Name: usuario trg_audit_usuario; Type: TRIGGER; Schema: public; Owner: aidsoft
--

CREATE TRIGGER trg_audit_usuario AFTER INSERT OR DELETE OR UPDATE ON public.usuario FOR EACH ROW EXECUTE FUNCTION public.fn_audit_usuario();


--
-- Name: usuario_habilidad trg_audit_usuario_habilidad; Type: TRIGGER; Schema: public; Owner: aidsoft
--

CREATE TRIGGER trg_audit_usuario_habilidad AFTER INSERT OR DELETE OR UPDATE ON public.usuario_habilidad FOR EACH ROW EXECUTE FUNCTION public.fn_audit_usuario_habilidad();


--
-- Name: certificaciones certificaciones_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.certificaciones
    ADD CONSTRAINT certificaciones_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


--
-- Name: experiencia experiencia_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.experiencia
    ADD CONSTRAINT experiencia_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


--
-- Name: oauth_account oauth_account_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.oauth_account
    ADD CONSTRAINT oauth_account_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


--
-- Name: proyecto_habilidad proyecto_habilidad_id_habilidad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.proyecto_habilidad
    ADD CONSTRAINT proyecto_habilidad_id_habilidad_fkey FOREIGN KEY (id_habilidad) REFERENCES public.habilidad(id_habilidad) ON DELETE CASCADE;


--
-- Name: proyecto_habilidad proyecto_habilidad_id_proyecto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.proyecto_habilidad
    ADD CONSTRAINT proyecto_habilidad_id_proyecto_fkey FOREIGN KEY (id_proyecto) REFERENCES public.proyecto(id_proyecto) ON DELETE CASCADE;


--
-- Name: proyecto proyecto_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.proyecto
    ADD CONSTRAINT proyecto_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


--
-- Name: proyecto_imagen proyecto_imagen_id_imagen_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.proyecto_imagen
    ADD CONSTRAINT proyecto_imagen_id_imagen_fkey FOREIGN KEY (id_imagen) REFERENCES public.imagen(id_imagen) ON DELETE CASCADE;


--
-- Name: proyecto_imagen proyecto_imagen_id_proyecto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.proyecto_imagen
    ADD CONSTRAINT proyecto_imagen_id_proyecto_fkey FOREIGN KEY (id_proyecto) REFERENCES public.proyecto(id_proyecto) ON DELETE CASCADE;


--
-- Name: rol_usuario rol_usuario_id_rol_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.rol_usuario
    ADD CONSTRAINT rol_usuario_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES public.rol(id_rol) ON DELETE CASCADE;


--
-- Name: rol_usuario rol_usuario_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.rol_usuario
    ADD CONSTRAINT rol_usuario_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


--
-- Name: usuario_habilidad usuario_habilidad_id_habilidad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.usuario_habilidad
    ADD CONSTRAINT usuario_habilidad_id_habilidad_fkey FOREIGN KEY (id_habilidad) REFERENCES public.habilidad(id_habilidad) ON DELETE CASCADE;


--
-- Name: usuario_habilidad usuario_habilidad_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.usuario_habilidad
    ADD CONSTRAINT usuario_habilidad_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


--
-- Name: usuario_habilidad_personalizada usuario_habilidad_personalizada_id_habilidad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.usuario_habilidad_personalizada
    ADD CONSTRAINT usuario_habilidad_personalizada_id_habilidad_fkey FOREIGN KEY (id_habilidad) REFERENCES public.habilidad(id_habilidad) ON DELETE CASCADE;


--
-- Name: usuario_habilidad_personalizada usuario_habilidad_personalizada_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.usuario_habilidad_personalizada
    ADD CONSTRAINT usuario_habilidad_personalizada_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


--
-- Name: usuario usuario_id_imagen_ci_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_id_imagen_ci_fkey FOREIGN KEY (id_imagen_ci) REFERENCES public.imagen(id_imagen) ON DELETE SET NULL;


--
-- Name: usuario usuario_id_imagen_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aidsoft
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_id_imagen_fkey FOREIGN KEY (id_imagen) REFERENCES public.imagen(id_imagen) ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: aidsoft
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

