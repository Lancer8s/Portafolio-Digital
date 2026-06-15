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
            ->leftJoin('imagen', 'usuario.id_imagen_ci', '=', 'imagen.id_imagen')
            ->where('usuario.ci_estado', 'Pendiente de revisión')
            ->select('usuario.id_usuario', 'usuario.nombre', 'usuario.apellido', 'usuario.email', 'usuario.ci_estado', 'imagen.ruta as ci_url')
            ->orderBy('usuario.fecha_registro', 'desc')
            ->get();

        foreach ($usuarios as $u) {
            if ($u->ci_url) {
                $u->ci_url = '/api/media/' . $u->ci_url;
            }
        }

        return response()->json(['ok' => true, 'usuarios' => $usuarios]);
    }

    public function verifyCI(Request $request, $id) {
        if (!$this->isAdmin($request->user()->id_usuario)) {
            return response()->json(['ok' => false, 'mensaje' => 'No autorizado'], 403);
        }

        $request->validate([
            'action' => 'required|in:approve,reject'
        ]);

        $action = $request->input('action');
        $estado = $action === 'approve' ? 'Verificado' : 'Rechazado';
        
        DB::table('usuario')
            ->where('id_usuario', $id)
            ->update(['ci_estado' => $estado]);

        return response()->json(['ok' => true, 'mensaje' => "El estado de verificación ha sido actualizado a $estado."]);
    }

    // ── Estadísticas del sistema ──────────────────────────────────────

    public function getEstadisticas(Request $request) {
        if (!$this->isAdmin($request->user()->id_usuario)) {
            return response()->json(['ok' => false, 'mensaje' => 'No autorizado'], 403);
        }

        $stats = DB::selectOne('SELECT * FROM v_estadisticas_admin');

        $ciPendientes = DB::table('usuario')
            ->where('ci_estado', 'Pendiente de revisión')
            ->count();

        // Usuarios registrados por mes (últimos 6 meses)
        $usuariosPorMes = DB::select("
            SELECT TO_CHAR(fecha_registro, 'YYYY-MM') as mes,
                   COUNT(*) as total
            FROM usuario
            WHERE fecha_registro >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(fecha_registro, 'YYYY-MM')
            ORDER BY mes
        ");

        // Distribución de proyectos por estado
        $proyectosPorEstado = DB::select("
            SELECT estado, COUNT(*) as total
            FROM proyecto
            GROUP BY estado
            ORDER BY total DESC
        ");

        return response()->json([
            'ok' => true,
            'estadisticas' => $stats,
            'ci_pendientes' => $ciPendientes,
            'usuarios_por_mes' => $usuariosPorMes,
            'proyectos_por_estado' => $proyectosPorEstado,
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

    public function getBitacoras(Request $request, $tabla) {
        if (!$this->isAdmin($request->user()->id_usuario)) {
            return response()->json(['ok' => false, 'mensaje' => 'No autorizado'], 403);
        }

        $tableName = $this->getTableName($tabla);
        if (!$tableName) {
            return response()->json(['ok' => false, 'mensaje' => 'Tabla no válida'], 400);
        }

        $query = DB::table($tableName)
            ->leftJoin('usuario', "$tableName.id_usuario_accion", '=', 'usuario.id_usuario')
            ->select(
                "$tableName.*",
                'usuario.nombre as actor_nombre',
                'usuario.apellido as actor_apellido',
                'usuario.email as actor_email'
            );

        // Filtros
        if ($request->filled('fecha_desde')) {
            $query->where("$tableName.fecha", '>=', $request->input('fecha_desde'));
        }
        if ($request->filled('fecha_hasta')) {
            $query->where("$tableName.fecha", '<=', $request->input('fecha_hasta'));
        }
        if ($request->filled('accion')) {
            $query->where("$tableName.accion", $request->input('accion'));
        }
        if ($request->filled('id_usuario')) {
            $query->where("$tableName.id_usuario_accion", $request->input('id_usuario'));
        }

        $query->orderBy("$tableName.fecha", 'desc')
              ->orderBy("$tableName.hora", 'desc');

        $perPage = min((int) $request->input('per_page', 15), 100);
        $registros = $query->paginate($perPage);

        // Resumen de acciones para la tabla actual con los mismos filtros
        $resumenQuery = DB::table($tableName)->select(
            DB::raw("COUNT(*) FILTER (WHERE accion = 'INSERT') as inserts"),
            DB::raw("COUNT(*) FILTER (WHERE accion = 'UPDATE') as updates"),
            DB::raw("COUNT(*) FILTER (WHERE accion = 'DELETE') as deletes"),
            DB::raw("COUNT(*) as total")
        );

        if ($request->filled('fecha_desde')) {
            $resumenQuery->where('fecha', '>=', $request->input('fecha_desde'));
        }
        if ($request->filled('fecha_hasta')) {
            $resumenQuery->where('fecha', '<=', $request->input('fecha_hasta'));
        }

        $resumen = $resumenQuery->first();

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

        $query = DB::table($tableName)
            ->leftJoin('usuario', "$tableName.id_usuario_accion", '=', 'usuario.id_usuario')
            ->select(
                "$tableName.id_bitacora",
                "$tableName.accion",
                "$tableName.descripcion",
                "$tableName.fecha",
                "$tableName.hora",
                'usuario.nombre as actor_nombre',
                'usuario.apellido as actor_apellido',
                'usuario.email as actor_email'
            );

        if ($request->filled('fecha_desde')) {
            $query->where("$tableName.fecha", '>=', $request->input('fecha_desde'));
        }
        if ($request->filled('fecha_hasta')) {
            $query->where("$tableName.fecha", '<=', $request->input('fecha_hasta'));
        }
        if ($request->filled('accion')) {
            $query->where("$tableName.accion", $request->input('accion'));
        }

        $query->orderBy("$tableName.fecha", 'desc')
              ->orderBy("$tableName.hora", 'desc');

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
