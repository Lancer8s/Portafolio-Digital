<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    private function isAdmin($userId) {
        return DB::table('rol_usuario')
            ->join('rol', 'rol_usuario.id_rol', '=', 'rol.id_rol')
            ->where('rol_usuario.id_usuario', $userId)
            ->where('rol.nombre', 'administrador')
            ->exists();
    }

    // ── Verificación de CI ────────────────────────────────────────────

    public function getPendingCI(Request $request) {
        if (!$this->isAdmin($request->user()->id_usuario)) {
            return response()->json(['ok' => false, 'mensaje' => 'No autorizado'], 403);
        }

        $usuarios = DB::table('usuario')
            ->leftJoin('imagen as ci_imagen', 'usuario.id_imagen_ci', '=', 'ci_imagen.id_imagen')
            ->leftJoin('imagen as perfil_imagen', 'usuario.id_imagen', '=', 'perfil_imagen.id_imagen')
            ->where('usuario.ci_estado', 'Pendiente de revisión')
            ->select(
                'usuario.id_usuario',
                'usuario.nombre',
                'usuario.apellido',
                'usuario.email',
                'usuario.ci_estado',
                'ci_imagen.ruta as ci_url',
                'perfil_imagen.ruta as foto_perfil_url'
            )
            ->orderBy('usuario.fecha_registro', 'desc')
            ->get();

        foreach ($usuarios as $u) {
            if ($u->ci_url) {
                $u->ci_url = '/api/media/' . $u->ci_url;
            }
            if ($u->foto_perfil_url) {
                $u->foto_perfil_url = '/api/media/' . $u->foto_perfil_url;
            }
        }

        return response()->json(['ok' => true, 'usuarios' => $usuarios]);
    }

    public function verifyCI(Request $request, $id) {
        if (!$this->isAdmin($request->user()->id_usuario)) {
            return response()->json(['ok' => false, 'mensaje' => 'No autorizado'], 403);
        }

        $request->validate([
            'action' => 'required|in:approve,reject',
            'motivo_rechazo' => 'required_if:action,reject|nullable|string|max:1000',
        ], [
            'motivo_rechazo.required_if' => 'Debes indicar el motivo del rechazo.',
        ]);

        $action = $request->input('action');
        $estado = $action === 'approve' ? 'Verificado' : 'Rechazado';
        $motivo = $action === 'reject' ? trim($request->input('motivo_rechazo')) : null;

        $updated = DB::table('usuario')
            ->where('id_usuario', $id)
            ->update([
                'ci_estado' => $estado,
                'motivo_rechazo_ci' => $motivo,
            ]);

        if (!$updated && !DB::table('usuario')->where('id_usuario', $id)->exists()) {
            return response()->json(['ok' => false, 'mensaje' => 'Usuario no encontrado'], 404);
        }

        return response()->json([
            'ok' => true,
            'mensaje' => "El estado de verificación ha sido actualizado a $estado.",
            'estado_verificacion' => $estado,
            'motivo_rechazo_ci' => $motivo,
        ]);
    }

    // ── Estadísticas del sistema ──────────────────────────────────────

    public function getEstadisticas(Request $request) {
        if (!$this->isAdmin($request->user()->id_usuario)) {
            return response()->json(['ok' => false, 'mensaje' => 'No autorizado'], 403);
        }

        $viewStats = (array) DB::selectOne('SELECT * FROM v_estadisticas_admin');
        unset($viewStats['proyectos_completados'], $viewStats['proyectos_no_completados']);

        $usuariosActivos = DB::table('personal_access_tokens as pat')
            ->join('usuario as u', 'pat.tokenable_id', '=', 'u.id_usuario')
            ->where('pat.tokenable_type', \App\Models\Usuario::class)
            ->whereNotNull('pat.last_used_at')
            ->where('pat.last_used_at', '>=', now()->subMinutes(15))
            ->distinct()
            ->count('pat.tokenable_id');

        $totalProyectos = DB::table('proyecto')->count();
        $totalExperiencias = DB::table('experiencia')
            ->where('tipo', 'laboral')
            ->count();
        $totalFormaciones = DB::table('experiencia')
            ->where('tipo', 'academica')
            ->count();

        $stats = array_merge($viewStats, [
            'total_usuarios' => DB::table('usuario')->count(),
            'usuarios_activos' => $usuariosActivos,
            'total_proyectos' => $totalProyectos,
            'total_experiencias' => $totalExperiencias,
            'total_formaciones' => $totalFormaciones,
        ]);

        $ciPendientes = DB::table('usuario')
            ->where('ci_estado', 'Pendiente de revisión')
            ->count();

        // Usuarios registrados por mes (ultimos 6 meses)
        $usuariosPorMes = DB::select("
            SELECT TO_CHAR(m.mes, 'YYYY-MM') AS periodo,
                   COUNT(u.id_usuario)::INTEGER AS total
            FROM generate_series(
                DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
                DATE_TRUNC('month', CURRENT_DATE),
                INTERVAL '1 month'
            ) AS m(mes)
            LEFT JOIN usuario u
              ON DATE_TRUNC('month', u.fecha_registro) = m.mes
            GROUP BY m.mes
            ORDER BY m.mes
        ");

        $nombresMes = [
            1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
            5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
            9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre',
        ];

        foreach ($usuariosPorMes as $registro) {
            $numeroMes = (int) substr($registro->periodo, 5, 2);
            $registro->mes = $nombresMes[$numeroMes];
            $registro->total = (int) $registro->total;
        }

        // Estado de verificacion de usuarios
        $verificacionesPorEstado = DB::select("
            WITH estados_base(estado, orden) AS (
                VALUES
                    ('aprobado', 1),
                    ('pendiente', 2),
                    ('rechazado', 3),
                    ('sin_solicitar', 4)
            ),
            conteos AS (
                SELECT CASE
                    WHEN ci_estado IS NULL OR BTRIM(ci_estado) = '' THEN 'sin_solicitar'
                    WHEN LOWER(BTRIM(ci_estado)) IN ('verificado', 'aprobado') THEN 'aprobado'
                    WHEN LOWER(BTRIM(ci_estado)) LIKE 'pendiente%' THEN 'pendiente'
                    WHEN LOWER(BTRIM(ci_estado)) = 'rechazado' THEN 'rechazado'
                    ELSE 'sin_solicitar'
                END AS estado
                FROM usuario
            )
            SELECT eb.estado, COALESCE(COUNT(c.estado), 0)::INTEGER AS total
            FROM estados_base eb
            LEFT JOIN conteos c ON c.estado = eb.estado
            GROUP BY eb.estado, eb.orden
            ORDER BY eb.orden
        ");

        return response()->json([
            'ok' => true,
            'estadisticas' => $stats,
            'ci_pendientes' => $ciPendientes,
            'usuarios_por_mes' => $usuariosPorMes,
            'verificaciones_por_estado' => $verificacionesPorEstado,
        ]);
    }

    // ── Bitácoras de auditoría ────────────────────────────────────────

    private function getTableName($tabla) {
        $mapping = [
            'usuario'   => 'bitacora_usuario',
            'proyecto'  => 'bitacora_proyecto',
            'habilidad' => 'bitacora_usuario_habilidad',
            'rol'       => 'bitacora_rol_usuario',
        ];
        return $mapping[$tabla] ?? null;
    }

    private function buildBitacoraQuery(Request $request, $tableName) {
        $query = DB::table("{$tableName} as bitacora")
            ->leftJoin('usuario as actor_usuario', 'bitacora.id_usuario_accion', '=', 'actor_usuario.id_usuario');

        if ($request->filled('fecha_desde')) {
            $query->where('bitacora.fecha', '>=', $request->input('fecha_desde'));
        }
        if ($request->filled('fecha_hasta')) {
            $query->where('bitacora.fecha', '<=', $request->input('fecha_hasta'));
        }
        if ($request->filled('accion')) {
            $query->where('bitacora.accion', $request->input('accion'));
        }
        if ($request->filled('id_usuario')) {
            $query->where('bitacora.id_usuario_accion', $request->input('id_usuario'));
        }

        if ($request->filled('search_user')) {
            $search = '%'.trim($request->input('search_user')).'%';
            $query->whereRaw(
                "CONCAT_WS(' ', COALESCE(actor_usuario.nombre, ''), COALESCE(actor_usuario.apellido, ''), COALESCE(actor_usuario.email, '')) ILIKE ?",
                [$search]
            );
        }

        $profileStatus = $request->input('profile_status');
        if (in_array($profileStatus, ['completed', 'incomplete'], true)) {
            $query->whereNotNull('actor_usuario.id_usuario');
            if ($profileStatus === 'completed') {
                $query->where(function ($profileQuery) {
                    $profileQuery
                        ->whereNotNull('actor_usuario.profesion')
                        ->where('actor_usuario.profesion', '<>', '')
                        ->whereNotNull('actor_usuario.telefono')
                        ->where('actor_usuario.telefono', '<>', '')
                        ->whereNotNull('actor_usuario.biografia')
                        ->where('actor_usuario.biografia', '<>', '')
                        ->whereNotNull('actor_usuario.id_imagen');
                });
            } else {
                $query->where(function ($profileQuery) {
                    $profileQuery
                        ->whereNull('actor_usuario.profesion')
                        ->orWhere('actor_usuario.profesion', '')
                        ->orWhereNull('actor_usuario.telefono')
                        ->orWhere('actor_usuario.telefono', '')
                        ->orWhereNull('actor_usuario.biografia')
                        ->orWhere('actor_usuario.biografia', '')
                        ->orWhereNull('actor_usuario.id_imagen');
                });
            }
        }

        $activityStatus = $request->input('activity_status');
        if (in_array($activityStatus, ['active', 'inactive'], true)) {
            $query->whereNotNull('actor_usuario.id_usuario');
            $activeToken = function ($tokenQuery) {
                $tokenQuery->select(DB::raw(1))
                    ->from('personal_access_tokens as active_token')
                    ->whereColumn('active_token.tokenable_id', 'actor_usuario.id_usuario')
                    ->where('active_token.tokenable_type', \App\Models\Usuario::class)
                    ->whereNotNull('active_token.last_used_at')
                    ->where('active_token.last_used_at', '>=', now()->subMinutes(15));
            };

            if ($activityStatus === 'active') {
                $query->whereExists($activeToken);
            } else {
                $query->whereNotExists($activeToken);
            }
        }

        return $query;
    }

    public function getBitacoras(Request $request, $tabla) {
        if (!$this->isAdmin($request->user()->id_usuario)) {
            return response()->json(['ok' => false, 'mensaje' => 'No autorizado'], 403);
        }

        $tableName = $this->getTableName($tabla);
        if (!$tableName) {
            return response()->json(['ok' => false, 'mensaje' => 'Tabla no válida'], 400);
        }

        $query = $this->buildBitacoraQuery($request, $tableName);

        $resumen = (clone $query)
            ->selectRaw("COUNT(*) FILTER (WHERE bitacora.accion = 'INSERT') as inserts")
            ->selectRaw("COUNT(*) FILTER (WHERE bitacora.accion = 'UPDATE') as updates")
            ->selectRaw("COUNT(*) FILTER (WHERE bitacora.accion = 'DELETE') as deletes")
            ->selectRaw('COUNT(*) as total')
            ->first();

        $query->select(
                'bitacora.*',
                'actor_usuario.nombre as actor_nombre',
                'actor_usuario.apellido as actor_apellido',
                'actor_usuario.email as actor_email'
            )
            ->orderBy('bitacora.fecha', 'desc')
            ->orderBy('bitacora.hora', 'desc');

        $perPage = min((int) $request->input('per_page', 15), 100);
        $registros = $query->paginate($perPage);

        return response()->json([
            'ok' => true,
            'registros' => $registros->items(),
            'paginacion' => [
                'pagina_actual' => $registros->currentPage(),
                'total_paginas' => $registros->lastPage(),
                'total_registros' => $registros->total(),
                'por_pagina' => $registros->perPage(),
            ],
            'resumen' => $resumen,
        ]);
    }

    public function exportBitacoraCSV(Request $request, $tabla) {
        if (!$this->isAdmin($request->user()->id_usuario)) {
            return response()->json(['ok' => false, 'mensaje' => 'No autorizado'], 403);
        }

        $tableName = $this->getTableName($tabla);
        if (!$tableName) {
            return response()->json(['ok' => false, 'mensaje' => 'Tabla no válida'], 400);
        }

        $query = $this->buildBitacoraQuery($request, $tableName)
            ->select(
                'bitacora.id_bitacora',
                'bitacora.accion',
                'bitacora.descripcion',
                'bitacora.fecha',
                'bitacora.hora',
                'actor_usuario.nombre as actor_nombre',
                'actor_usuario.apellido as actor_apellido',
                'actor_usuario.email as actor_email'
            );

        $query->orderBy('bitacora.fecha', 'desc')
              ->orderBy('bitacora.hora', 'desc');

        $registros = $query->get();

        $csv = "ID,Acción,Descripción,Fecha,Hora,Actor Nombre,Actor Apellido,Actor Email\n";
        foreach ($registros as $r) {
            $desc = str_replace('"', '""', $r->descripcion ?? '');
            $csv .= "\"{$r->id_bitacora}\",\"{$r->accion}\",\"{$desc}\",\"{$r->fecha}\",\"{$r->hora}\",\"{$r->actor_nombre}\",\"{$r->actor_apellido}\",\"{$r->actor_email}\"\n";
        }

        $filename = "bitacora_{$tabla}_" . date('Y-m-d') . ".csv";

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ]);
    }
}
