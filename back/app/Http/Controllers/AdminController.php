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
}
