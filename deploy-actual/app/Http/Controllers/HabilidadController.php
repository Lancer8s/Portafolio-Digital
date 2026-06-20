<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class HabilidadController extends Controller
{
    /**
     * Catálogo global sin habilidades personalizadas.
     */
    private function catalogoGlobal(): array
    {
        $data = cache()->remember('catalogo_habilidades', 600, function () {
            $result = DB::select("SELECT sp_listar_catalogo_habilidades() AS result");
            return json_decode($result[0]->result, true);
        });

        if (isset($data['tecnicas']) && is_array($data['tecnicas'])) {
            foreach (array_keys($data['tecnicas']) as $categoria) {
                if (str_contains(mb_strtolower($categoria), 'personaliz')) {
                    unset($data['tecnicas'][$categoria]);
                }
            }
        }

        if (isset($data['blandas']) && is_array($data['blandas'])) {
            $data['blandas'] = array_values(array_filter(
                $data['blandas'],
                fn ($item) => !str_contains(
                    mb_strtolower((string) ($item['categoria'] ?? '')),
                    'personaliz'
                )
            ));
        }

        return $data;
    }

    /**
     * GET /api/habilidades/catalogo
     * Devuelve el catálogo completo (público, sin autenticación).
     * Las habilidades personalizadas (categoria='Personalizada') NO se incluyen
     * en el catálogo público para evitar que aparezcan en el picker de otros usuarios.
     */
    public function catalogo()
    {
        // Cache del catálogo por 10 minutos — raramente cambia
        $data = cache()->remember('catalogo_habilidades', 600, function () {
            $result = DB::select("SELECT sp_listar_catalogo_habilidades() AS result");
            return json_decode($result[0]->result, true);
        });

        // Filtrar habilidades personalizadas del catálogo público.
        // El SP las agrupa bajo la clave "Personalizada" dentro de 'tecnicas'.
        // Las eliminamos para que no aparezcan en el selector de otros usuarios.
        if (isset($data['tecnicas']) && is_array($data['tecnicas'])) {
            unset($data['tecnicas']['Personalizada']);
        }

        return response()->json($data)
            ->header('Cache-Control', 'public, max-age=300');
    }

    /**
     * GET /api/habilidades/catalogo-usuario
     * Devuelve habilidades globales más las personalizadas del usuario autenticado.
     */
    public function catalogoUsuario(Request $request)
    {
        $idUsuario = $request->user()->id_usuario;
        $catalogo = $this->catalogoGlobal();

        $result = DB::select("SELECT sp_listar_habilidades_usuario(?) AS result", [$idUsuario]);
        $propias = json_decode($result[0]->result, true);

        if (!($propias['ok'] ?? false)) {
            return response()->json($catalogo);
        }

        $idsGlobales = [];
        $nombresGlobales = [];
        $registrarGlobal = function (array $item) use (&$idsGlobales, &$nombresGlobales) {
            if (isset($item['id_habilidad'])) {
                $idsGlobales[(string) $item['id_habilidad']] = true;
            }
            if (!empty($item['nombre'])) {
                $nombresGlobales[mb_strtolower(trim($item['nombre']))] = true;
            }
        };

        foreach (($catalogo['tecnicas'] ?? []) as $items) {
            if (is_array($items)) {
                foreach ($items as $item) {
                    if (is_array($item)) $registrarGlobal($item);
                }
            }
        }
        foreach (($catalogo['blandas'] ?? []) as $item) {
            if (is_array($item)) $registrarGlobal($item);
        }

        $esPersonalizada = function (array $item) use ($idsGlobales, $nombresGlobales): bool {
            $categoria = mb_strtolower((string) ($item['categoria'] ?? ''));
            if (str_contains($categoria, 'personaliz')) return true;

            $id = isset($item['id_habilidad']) ? (string) $item['id_habilidad'] : null;
            $nombre = mb_strtolower(trim((string) ($item['nombre'] ?? '')));

            return ($id && !isset($idsGlobales[$id]))
                || ($nombre !== '' && !isset($nombresGlobales[$nombre]));
        };

        $personalizadasTecnicas = [];
        foreach (($propias['tecnicas'] ?? []) as $item) {
            if (is_array($item) && $esPersonalizada($item)) {
                $item['tipo'] = 'tecnica';
                $item['categoria'] = 'Personalizadas técnicas';
                $personalizadasTecnicas[] = $item;
            }
        }

        $personalizadasBlandas = [];
        foreach (($propias['blandas'] ?? []) as $item) {
            if (is_array($item) && $esPersonalizada($item)) {
                $item['tipo'] = 'blanda';
                $item['categoria'] = 'Personalizadas blandas';
                $personalizadasBlandas[] = $item;
            }
        }

        if ($personalizadasTecnicas) {
            $catalogo['tecnicas']['Personalizadas técnicas'] = $personalizadasTecnicas;
        }
        if ($personalizadasBlandas) {
            $catalogo['blandas'] = array_values(array_merge(
                $catalogo['blandas'] ?? [],
                $personalizadasBlandas
            ));
        }

        $catalogo['ok'] = true;
        return response()->json($catalogo)
            ->header('Cache-Control', 'private, no-store');
    }

    /**
     * GET /api/habilidades
     * Lista las habilidades del usuario autenticado.
     * El SP devuelve {tecnicas, blandas} por separado.
     * Unificamos en un solo array 'habilidades' con campo 'tipo' para el frontend.
     */
    public function listar(Request $request)
    {
        $id     = $request->user()->id_usuario;
        $result = DB::select("SELECT sp_listar_habilidades_usuario(?) AS result", [$id]);
        $data   = json_decode($result[0]->result, true);

        if ($data['ok']) {
            // Unificar técnicas y blandas en un solo array con 'tipo'
            $habilidades = [];
            foreach (($data['tecnicas'] ?? []) as $t) {
                $t['tipo'] = 'tecnica';
                $habilidades[] = $t;
            }
            foreach (($data['blandas'] ?? []) as $b) {
                $b['tipo'] = 'blanda';
                $habilidades[] = $b;
            }
            $data['habilidades'] = $habilidades;
        }

        return response()->json($data, $data['ok'] ? 200 : 404);
    }

    public function listarParaUsuario($idUsuario)
    {
        $result = DB::select("SELECT sp_listar_habilidades_usuario(?) AS result", [$idUsuario]);
        $data   = json_decode($result[0]->result, true);

        if ($data['ok']) {
            return response()->json([
                'techSkills' => $data['tecnicas'] ?? [],
                'softSkills' => $data['blandas'] ?? [],
            ]);
        }

        return response()->json(['techSkills' => [], 'softSkills' => []]);
    }

    /**
     * POST /api/habilidades
     * Vincula una habilidad del catálogo al perfil.
     * Body: { id_habilidad, nivel? }
     */
    public function agregar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_habilidad' => 'required|integer',
            'nivel'        => 'nullable|integer|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['ok' => false, 'errores' => $validator->errors()], 422);
        }

        $id = $request->user()->id_usuario;

        $data = DB::transaction(function () use ($id, $request) {
            DB::statement("SET LOCAL app.usuario_actual = '{$id}'");

            $result = DB::select(
                "SELECT sp_agregar_habilidad_usuario(?,?,?) AS result",
                [$id, $request->id_habilidad, $request->nivel]
            );

            return json_decode($result[0]->result, true);
        });

        $codigo = $data['codigo'] ?? '';
        if ($codigo === 'CREADO') {
            $status = 201;
        } elseif ($codigo === 'DUPLICADO') {
            $status = 409;
        } else {
            $status = $data['ok'] ? 200 : 400;
        }

        return response()->json($data, $status);
    }

    /**
     * POST /api/habilidades/personalizada
     * Crea una habilidad personalizada y la vincula.
     * Body: { nombre, tipo, nivel? }
     */
    public function agregarPersonalizada(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:80',
            'tipo'   => 'required|in:tecnica,blanda',
            'nivel'  => 'nullable|integer|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['ok' => false, 'errores' => $validator->errors()], 422);
        }

        $id = $request->user()->id_usuario;

        $data = DB::transaction(function () use ($id, $request) {
            DB::statement("SET LOCAL app.usuario_actual = '{$id}'");

            $result = DB::select(
                "SELECT sp_agregar_habilidad_personalizada(?,?,?,?) AS result",
                [$id, $request->nombre, $request->tipo, $request->nivel]
            );

            return json_decode($result[0]->result, true);
        });

        return response()->json($data, $data['ok'] ? 201 : 400);
    }

    /**
     * PUT /api/habilidades/{id_habilidad}/nivel
     * Actualiza el nivel de una habilidad técnica.
     * Body: { nivel }
     */
    public function editarNivel(Request $request, int $idHabilidad)
    {
        $validator = Validator::make($request->all(), [
            'nivel' => 'required|integer|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['ok' => false, 'errores' => $validator->errors()], 422);
        }

        $id = $request->user()->id_usuario;

        $data = DB::transaction(function () use ($id, $idHabilidad, $request) {
            DB::statement("SET LOCAL app.usuario_actual = '{$id}'");

            $result = DB::select(
                "SELECT sp_editar_nivel_habilidad(?,?,?) AS result",
                [$id, $idHabilidad, $request->nivel]
            );

            return json_decode($result[0]->result, true);
        });

        return response()->json($data, $data['ok'] ? 200 : 400);
    }

    /**
     * DELETE /api/habilidades/{id_habilidad}
     * Desvincula una habilidad del perfil.
     */
    public function eliminar(Request $request, int $idHabilidad)
    {
        $id = $request->user()->id_usuario;

        $data = DB::transaction(function () use ($id, $idHabilidad) {
            DB::statement("SET LOCAL app.usuario_actual = '{$id}'");

            $result = DB::select(
                "SELECT sp_eliminar_habilidad_usuario(?,?) AS result",
                [$id, $idHabilidad]
            );

            return json_decode($result[0]->result, true);
        });

        return response()->json($data, $data['ok'] ? 200 : 404);
    }

    /**
     * PUT /api/habilidades/sincronizar
     * Reemplaza TODAS las habilidades de un tipo en bloque.
     * Body: { tipo: 'tecnica'|'blanda', habilidades: [{id_habilidad, nivel?},...] }
     */
    public function sincronizar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tipo'         => 'required|in:tecnica,blanda',
            'habilidades'  => 'present|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['ok' => false, 'errores' => $validator->errors()], 422);
        }

        $id = $request->user()->id_usuario;
        $habilidadesJson = json_encode($request->habilidades ?: []);

        $data = DB::transaction(function () use ($id, $request, $habilidadesJson) {
            DB::statement("SET LOCAL app.usuario_actual = '{$id}'");

            $result = DB::select(
                "SELECT sp_sincronizar_habilidades(?,?,?::jsonb) AS result",
                [$id, $request->tipo, $habilidadesJson]
            );

            return json_decode($result[0]->result, true);
        });

        return response()->json($data, $data['ok'] ? 200 : 400);
    }
}
