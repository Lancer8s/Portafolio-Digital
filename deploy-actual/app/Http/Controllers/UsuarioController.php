<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use App\Models\Certificacion;

class UsuarioController extends Controller
{
    /**
     * GET /api/usuario/perfil
     * Devuelve el perfil completo del usuario autenticado.
     * El SP devuelve { ok, perfil: { ..., foto_url: ruta_relativa, ... } }
     */
    public function perfil(Request $request)
    {
        $id = $request->user()->id_usuario;

        $result = DB::select("SELECT sp_obtener_perfil_usuario(?) AS result", [$id]);
        $data   = json_decode($result[0]->result, true);

        // La foto_url del SP es la ruta relativa; construimos la URL completa
        if ($data['ok'] && !empty($data['perfil']['foto_url'])) {
            $data['perfil']['foto_url'] = '/api/media/' . $data['perfil']['foto_url'];
        }

        return response()->json($data, $data['ok'] ? 200 : 404);
    }

    /**
     * PUT /api/usuario/perfil
     * Actualiza nombre, apellido, profesion y/o biografia.
     */
    public function actualizarPerfil(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre'    => 'nullable|string|max:80',
            'apellido'  => 'nullable|string|max:80',
            'profesion' => 'nullable|string|max:120',
            'biografia' => 'nullable|string',
            'titulo_profesional' => 'nullable|string|max:150',
            'linkedin_url' => 'nullable|url|max:300',
            'github_url' => 'nullable|url|max:300',
            'visibilidad' => 'nullable|string|in:publico,privado',
            'redes_sociales' => 'nullable|array',
            'telefono' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['ok' => false, 'errores' => $validator->errors()], 422);
        }

        $id = $request->user()->id_usuario;

        $data = DB::transaction(function () use ($id, $request) {
            DB::statement("SET LOCAL app.usuario_actual = '{$id}'");

            $result = DB::select(
                "SELECT sp_actualizar_perfil_usuario(?,?,?,?,?,?,?,?,?,?,?) AS result",
                [
                    $id,
                    $request->nombre,
                    $request->apellido,
                    $request->profesion,
                    $request->biografia,
                    $request->titulo_profesional,
                    $request->linkedin_url,
                    $request->github_url,
                    $request->visibilidad,
                    $request->has('redes_sociales') ? json_encode($request->redes_sociales) : null,
                    $request->telefono
                ]
            );

            return json_decode($result[0]->result, true);
        });

        return response()->json($data, $data['ok'] ? 200 : 400);
    }

    /**
     * POST /api/usuario/foto
     * Sube o reemplaza la foto de perfil.
     * Form-data: foto_perfil (file)
     */
    public function actualizarFoto(Request $request)
    {
        // Compatibilidad con clientes anteriores que todavía envían "foto".
        if (!$request->hasFile('foto_perfil') && $request->hasFile('foto')) {
            $request->files->set('foto_perfil', $request->file('foto'));
        }

        $validator = Validator::make($request->all(), [
            'foto_perfil' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ], [
            'foto_perfil.image' => 'El archivo debe ser una imagen válida.',
            'foto_perfil.mimes' => 'Formato no válido. Solo se permiten imágenes JPG o PNG.',
            'foto_perfil.max' => 'El archivo es demasiado grande. El tamaño máximo permitido es 2 MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['ok' => false, 'errores' => $validator->errors()], 422);
        }

        if (!$request->hasFile('foto_perfil') || !$request->file('foto_perfil')->isValid()) {
            return response()->json([
                'ok' => false,
                'mensaje' => 'No se recibió una imagen válida. Verifica el formato y que no supere los 2 MB.',
            ], 422);
        }

        $id   = $request->user()->id_usuario;
        $file = $request->file('foto_perfil');
        $ruta = null;

        try {
            $ruta = $file->store('fotos_perfil', 'public');

            if (!$ruta) {
                throw new \RuntimeException('No fue posible almacenar la imagen.');
            }

            $nombre    = $file->getClientOriginalName();
            $tipo      = $file->getMimeType();
            $tamanioKb = (int) round($file->getSize() / 1024);

            $data = DB::transaction(function () use ($id, $ruta, $nombre, $tipo, $tamanioKb) {
                DB::statement("SET LOCAL app.usuario_actual = '{$id}'");

                $result = DB::select(
                    "SELECT sp_actualizar_foto_perfil(?,?,?,?,?,?) AS result",
                    [$id, $ruta, $nombre, $tipo, $tamanioKb, 'perfil']
                );

                if (empty($result) || !isset($result[0]->result)) {
                    throw new \RuntimeException('El servidor no confirmó la actualización de la foto.');
                }

                $response = json_decode($result[0]->result, true);

                if (!is_array($response)) {
                    throw new \RuntimeException('La respuesta al actualizar la foto no es válida.');
                }

                return $response;
            });

            if (empty($data['ok'])) {
                try {
                    Storage::disk('public')->delete($ruta);
                } catch (\Throwable $cleanupException) {
                    report($cleanupException);
                }

                return response()->json([
                    'ok' => false,
                    'mensaje' => $data['mensaje'] ?? 'No se pudo actualizar la foto de perfil.',
                ], 400);
            }

            $data['foto_url'] = '/api/media/' . $ruta;

            return response()->json($data, 200);
        } catch (\Throwable $exception) {
            if ($ruta) {
                try {
                    Storage::disk('public')->delete($ruta);
                } catch (\Throwable $cleanupException) {
                    report($cleanupException);
                }
            }

            report($exception);

            return response()->json([
                'ok' => false,
                'mensaje' => 'No se pudo procesar la foto de perfil. Intenta con otra imagen JPG o PNG de hasta 2 MB.',
            ], 500);
        }
    }

    public function actualizarCI(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ci' => 'required|file|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['ok' => false, 'errores' => $validator->errors()], 422);
        }

        $id   = $request->user()->id_usuario;
        $file = $request->file('ci');

        $ruta       = $file->store('documentos_ci', 'public');
        $nombre     = $file->getClientOriginalName();
        $tipo       = $file->getMimeType();
        $tamanioKb  = (int) round($file->getSize() / 1024);

        $data = DB::transaction(function () use ($id, $ruta, $nombre, $tipo, $tamanioKb) {
            DB::statement("SET LOCAL app.usuario_actual = '{$id}'");

            // We can just reuse sp_actualizar_foto_perfil or create a new one. 
            // Wait, we need to update id_imagen_ci and ci_estado!
            // Let's do it with raw queries or eloquent since it's simple.
            
            // First, insert image.
            $imagenId = DB::table('imagen')->insertGetId([
                'ruta' => $ruta,
                'nombre' => $nombre,
                'tipo' => $tipo,
                'tamanio_kb' => $tamanioKb,
                'contexto' => 'perfil'
            ], 'id_imagen');

            DB::table('usuario')
                ->where('id_usuario', $id)
                ->update([
                    'id_imagen_ci' => $imagenId,
                    'ci_estado' => 'Pendiente de revisión'
                ]);

            return ['ok' => true, 'mensaje' => 'Documento recibido. Tu identidad está pendiente de verificación'];
        });

        return response()->json($data, 200);
    }

    /**
     * PUT /api/usuario/password
     * Cambia la contraseña. Campos: password_actual, password_nuevo
     */
    public function cambiarPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'password_actual' => 'required|string',
            'password_nuevo'  => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json(['ok' => false, 'errores' => $validator->errors()], 422);
        }

        $usuario = $request->user();

        if (!Hash::check($request->password_actual, $usuario->password_hash)) {
            return response()->json([
                'ok'      => false,
                'codigo'  => 'PASSWORD_INCORRECTO',
                'mensaje' => 'La contraseña actual es incorrecta',
            ], 401);
        }

        $nuevoHash = Hash::make($request->password_nuevo);

        $data = DB::transaction(function () use ($usuario, $nuevoHash) {
            DB::statement("SET LOCAL app.usuario_actual = '{$usuario->id_usuario}'");

            $result = DB::select(
                "SELECT sp_cambiar_password(?,?) AS result",
                [$usuario->id_usuario, $nuevoHash]
            );

            return json_decode($result[0]->result, true);
        });

        return response()->json($data, $data['ok'] ? 200 : 400);
    }

    /**
     * DELETE /api/usuario
     * Soft-delete: desactiva la cuenta del usuario.
     */
    public function desactivar(Request $request)
    {
        $id = $request->user()->id_usuario;

        $data = DB::transaction(function () use ($id) {
            DB::statement("SET LOCAL app.usuario_actual = '{$id}'");

            $result = DB::select("SELECT sp_desactivar_usuario(?) AS result", [$id]);
            return json_decode($result[0]->result, true);
        });

        if ($data['ok']) {
            $request->user()->tokens()->delete();
        }

        return response()->json($data, $data['ok'] ? 200 : 400);
    }

    /**
     * GET /api/portafolios/buscar?q=...
     * Búsqueda pública de portafolios por nombre, profesión o habilidades.
     * No modifica tablas — solo consultas SELECT sobre las tablas existentes.
     */
    public function buscarPortafolios(Request $request)
    {
        $q = trim($request->query('q', ''));

        if (strlen($q) < 2) {
            return response()->json([
                'ok' => true,
                'resultados' => [],
                'total' => 0,
                'mensaje' => 'Ingresa al menos 2 caracteres para buscar',
            ]);
        }

        $termino = '%' . mb_strtolower($q) . '%';

        // Buscar usuarios públicos cuyo nombre, apellido, profesión, título profesional
        // o habilidades coincidan con el término de búsqueda.
        // Usamos DISTINCT para evitar duplicados por múltiples habilidades coincidentes.
        // Solo se muestran usuarios con perfil completo (datos obligatorios llenos).
        $usuarios = DB::select("
            SELECT DISTINCT u.id_usuario,
                   u.nombre,
                   u.apellido,
                   u.profesion,
                   u.titulo_profesional,
                   u.biografia,
                   u.ci_estado,
                   i.ruta AS foto_ruta
            FROM usuario u
            LEFT JOIN imagen i ON i.id_imagen = u.id_imagen
            LEFT JOIN usuario_habilidad uh ON uh.id_usuario = u.id_usuario
            LEFT JOIN habilidad h ON h.id_habilidad = uh.id_habilidad
            WHERE u.activo = true
              AND u.visibilidad = 'publico'
              AND u.profesion IS NOT NULL AND u.profesion <> ''
              AND u.telefono IS NOT NULL AND u.telefono <> ''
              AND u.biografia IS NOT NULL AND u.biografia <> ''
              AND u.id_imagen IS NOT NULL
              AND (
                    LOWER(u.nombre) LIKE ?
                 OR LOWER(u.apellido) LIKE ?
                 OR LOWER(CONCAT(u.nombre, ' ', u.apellido)) LIKE ?
                 OR LOWER(COALESCE(u.profesion, '')) LIKE ?
                 OR LOWER(COALESCE(u.titulo_profesional, '')) LIKE ?
                 OR LOWER(COALESCE(h.nombre, '')) LIKE ?
              )
            ORDER BY u.nombre ASC
            LIMIT 20
        ", [$termino, $termino, $termino, $termino, $termino, $termino]);

        // Para cada usuario, obtener sus habilidades (máximo 6 para la vista previa)
        $resultados = [];
        foreach ($usuarios as $u) {
            $habilidades = DB::select("
                SELECT h.nombre, h.tipo
                FROM usuario_habilidad uh
                JOIN habilidad h ON h.id_habilidad = uh.id_habilidad
                WHERE uh.id_usuario = ?
                ORDER BY h.tipo ASC, h.nombre ASC
                LIMIT 6
            ", [$u->id_usuario]);

            $resultados[] = [
                'id_usuario' => $u->id_usuario,
                'nombre' => $u->nombre,
                'apellido' => $u->apellido,
                'profesion' => $u->profesion,
                'titulo_profesional' => $u->titulo_profesional,
                'biografia' => $u->biografia ? mb_substr($u->biografia, 0, 120) . (mb_strlen($u->biografia) > 120 ? '...' : '') : null,
                'ci_estado' => $u->ci_estado,
                'foto_url' => $u->foto_ruta ? '/api/media/' . $u->foto_ruta : null,
                'habilidades' => array_map(fn($h) => ['nombre' => $h->nombre, 'tipo' => $h->tipo], $habilidades),
            ];
        }

        return response()->json([
            'ok' => true,
            'resultados' => $resultados,
            'total' => count($resultados),
        ]);
    }

    /**
     * GET /api/portafolio/{id}
     * Obtiene el perfil completo (proyectos, habilidades, etc) para vista pública.
     * Si visibilidad = 'privado', no lo permite.
     */
    public function perfilPublico(Request $request, $id)
    {
        $result = DB::select("SELECT sp_obtener_perfil_usuario(?) AS result", [$id]);
        $data = json_decode($result[0]->result, true);

        if (!$data['ok']) {
            return response()->json($data, 404);
        }

        // Determinar si el usuario autenticado es el dueño del portafolio
        $authUser = null;
        try {
            $authUser = \Illuminate\Support\Facades\Auth::guard('sanctum')->user();
        } catch (\Exception $e) {
            // No autenticado, continuar como visitante
        }
        $isOwner = $authUser && (int) $authUser->id_usuario === (int) $id;

        // Verificar visibilidad — el dueño siempre puede ver su propio portafolio
        if ($data['perfil']['visibilidad'] === 'privado' && !$isOwner) {
            return response()->json([
                'ok' => false,
                'codigo' => 'PERFIL_PRIVADO',
                'mensaje' => 'Este perfil es privado'
            ], 403);
        }

        // Verificar completitud del perfil — perfiles incompletos no son públicos
        if (!$isOwner) {
            $perfil = $data['perfil'];
            $perfilCompleto = !empty($perfil['profesion'])
                && !empty($perfil['telefono'])
                && !empty($perfil['biografia'])
                && !empty($perfil['foto_url']);

            if (!$perfilCompleto) {
                return response()->json([
                    'ok' => false,
                    'codigo' => 'PERFIL_INCOMPLETO',
                    'mensaje' => 'Este portafolio aún no está disponible porque el usuario no ha completado su perfil'
                ], 403);
            }
        }

        // Obtener habilidades, proyectos y experiencias
        $habilidadesObj = app(\App\Http\Controllers\HabilidadController::class)->listarParaUsuario($id);
        $proyectosObj = app(\App\Http\Controllers\ProyectoController::class)->listarParaUsuario($id);
        
        $experiencias = DB::select("
            SELECT id_experiencia, tipo, institucion_empresa, cargo_titulo, 
                   fecha_inicio, fecha_fin, descripcion, nivel_academico, referencias, url_certificado
            FROM experiencia 
            WHERE id_usuario = ? 
            ORDER BY COALESCE(fecha_inicio, fecha_fin) DESC", [$id]);

        $data['perfil']['techSkills'] = $habilidadesObj->getData(true)['techSkills'] ?? [];
        $data['perfil']['softSkills'] = $habilidadesObj->getData(true)['softSkills'] ?? [];
        
        $todosProyectos = $proyectosObj->getData(true)['proyectos'] ?? [];
        // Enviar todos los proyectos al frontend (el frontend separa destacados vs generales)
        // Los proyectos con visible_portafolio=true aparecen como "Destacados"
        // y los con visible_portafolio=false aparecen como "Proyectos Generales"
        $data['perfil']['proyectos'] = array_values($todosProyectos);
        $data['perfil']['experiencias'] = $experiencias;
        $data['perfil']['certificaciones'] = Certificacion::where('user_id', $id)
            ->orderByDesc('fecha_emision')
            ->orderByDesc('id')
            ->get();
        $data['perfil']['is_owner'] = $isOwner;

        // Ocultar datos sensibles (ci_estado se mantiene para el badge de verificación)
        unset($data['perfil']['email']);
        unset($data['perfil']['id_usuario']);

        return response()->json($data, 200);
    }
}
