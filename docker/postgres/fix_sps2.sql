-- Fix sp_obtener_perfil_usuario to include telefono
CREATE OR REPLACE FUNCTION sp_obtener_perfil_usuario(p_id_usuario INT)
RETURNS JSONB LANGUAGE plpgsql AS $$
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

-- Fix sp_actualizar_perfil_usuario to include telefono
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
RETURNS JSONB LANGUAGE plpgsql AS $$
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
