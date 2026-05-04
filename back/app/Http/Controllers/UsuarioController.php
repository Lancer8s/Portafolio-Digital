<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

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
     * Form-data: foto (file)
     */
    public function actualizarFoto(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'foto' => 'required|file|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['ok' => false, 'errores' => $validator->errors()], 422);
        }

        $id   = $request->user()->id_usuario;
        $file = $request->file('foto');

        $ruta       = $file->store('fotos_perfil', 'public');
        $nombre     = $file->getClientOriginalName();
        $tipo       = $file->getMimeType();
        $tamanioKb  = (int) round($file->getSize() / 1024);

        $data = DB::transaction(function () use ($id, $ruta, $nombre, $tipo, $tamanioKb) {
            DB::statement("SET LOCAL app.usuario_actual = '{$id}'");

            $result = DB::select(
                "SELECT sp_actualizar_foto_perfil(?,?,?,?,?,?) AS result",
                [$id, $ruta, $nombre, $tipo, $tamanioKb, 'perfil']
            );

            return json_decode($result[0]->result, true);
        });

        if ($data['ok']) {
            $data['foto_url'] = '/api/media/' . $ruta;
        }

        return response()->json($data, $data['ok'] ? 200 : 400);
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
     * GET /api/portafolio/{id}
     * Obtiene el perfil completo (proyectos, habilidades, etc) para vista pública.
     * Si visibilidad = 'privado', no lo permite.
     */
    public function perfilPublico($id)
    {
        $result = DB::select("SELECT sp_obtener_perfil_usuario(?) AS result", [$id]);
        $data = json_decode($result[0]->result, true);

        if (!$data['ok']) {
            return response()->json($data, 404);
        }

        // Verificar visibilidad
        if ($data['perfil']['visibilidad'] === 'privado') {
            return response()->json([
                'ok' => false,
                'codigo' => 'PERFIL_PRIVADO',
                'mensaje' => 'Este perfil es privado'
            ], 403);
        }

        // Si es público, obtener habilidades, proyectos y experiencias
        $habilidadesObj = app(\App\Http\Controllers\HabilidadController::class)->listarParaUsuario($id);
        $proyectosObj = app(\App\Http\Controllers\ProyectoController::class)->listarParaUsuario($id);
        
        $experiencias = DB::select("
            SELECT id_experiencia, tipo, institucion_empresa, cargo_titulo, 
                   fecha_inicio, fecha_fin, descripcion 
            FROM experiencia 
            WHERE id_usuario = ? 
            ORDER BY fecha_inicio DESC", [$id]);

        $data['perfil']['techSkills'] = $habilidadesObj->getData(true)['techSkills'] ?? [];
        $data['perfil']['softSkills'] = $habilidadesObj->getData(true)['softSkills'] ?? [];
        $data['perfil']['proyectos'] = $proyectosObj->getData(true)['proyectos'] ?? [];
        $data['perfil']['experiencias'] = $experiencias;

        // Ocultar datos sensibles
        unset($data['perfil']['email']); // Opcional, pero recomendado
        unset($data['perfil']['ci_estado']);
        unset($data['perfil']['id_usuario']);

        return response()->json($data, 200);
    }
}