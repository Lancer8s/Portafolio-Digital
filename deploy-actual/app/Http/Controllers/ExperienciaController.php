<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Models\Experiencia;

class ExperienciaController extends Controller
{
    public function listar(Request $request)
    {
        try {
            $idUsuario = $request->user()->id_usuario;
            $experiencias = Experiencia::where('id_usuario', $idUsuario)
                ->orderBy('fecha_inicio', 'desc')
                ->get();
            return response()->json(['ok' => true, 'experiencias' => $experiencias]);
        } catch (\Throwable $e) {
            \Log::error('Error listando experiencias: ' . $e->getMessage());
            return response()->json([
                'ok' => false,
                'mensaje' => 'No se pudieron cargar las experiencias',
            ], 500);
        }
    }

    public function crear(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tipo' => 'required|in:laboral,academica',
            'institucion_empresa' => 'required|string|max:150',
            'cargo_titulo' => 'required|string|max:150',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'descripcion' => 'nullable|string',
        ], [
            'institucion_empresa.required' => 'El nombre de la empresa es obligatorio',
            'fecha_fin.after_or_equal' => 'La fecha de fin no puede ser anterior a la fecha de inicio'
        ]);

        if ($validator->fails()) {
            return response()->json(['ok' => false, 'errores' => $validator->errors()], 422);
        }

        try {
            $experiencia = new Experiencia($request->only([
                'tipo',
                'institucion_empresa',
                'cargo_titulo',
                'fecha_inicio',
                'fecha_fin',
                'descripcion',
            ]));
            $experiencia->id_usuario = $request->user()->id_usuario;
            $experiencia->save();
        } catch (\Throwable $e) {
            \Log::error('Error creando experiencia: ' . $e->getMessage());
            return response()->json([
                'ok' => false,
                'mensaje' => 'No se pudo guardar la experiencia',
            ], 500);
        }

        return response()->json(['ok' => true, 'experiencia' => $experiencia]);
    }

    public function actualizar(Request $request, $id)
    {
        $experiencia = Experiencia::where('id_experiencia', $id)
            ->where('id_usuario', $request->user()->id_usuario)
            ->first();

        if (!$experiencia) {
            return response()->json(['ok' => false, 'mensaje' => 'No encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'tipo' => 'required|in:laboral,academica',
            'institucion_empresa' => 'required|string|max:150',
            'cargo_titulo' => 'required|string|max:150',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'descripcion' => 'nullable|string',
        ], [
            'institucion_empresa.required' => 'El nombre de la empresa es obligatorio',
            'fecha_fin.after_or_equal' => 'La fecha de fin no puede ser anterior a la fecha de inicio'
        ]);

        if ($validator->fails()) {
            return response()->json(['ok' => false, 'errores' => $validator->errors()], 422);
        }

        try {
            $experiencia->update($request->only([
                'tipo',
                'institucion_empresa',
                'cargo_titulo',
                'fecha_inicio',
                'fecha_fin',
                'descripcion',
            ]));
        } catch (\Throwable $e) {
            \Log::error('Error actualizando experiencia: ' . $e->getMessage());
            return response()->json([
                'ok' => false,
                'mensaje' => 'No se pudo actualizar la experiencia',
            ], 500);
        }

        return response()->json(['ok' => true, 'experiencia' => $experiencia]);
    }

    public function eliminar(Request $request, $id)
    {
        $experiencia = Experiencia::where('id_experiencia', $id)
            ->where('id_usuario', $request->user()->id_usuario)
            ->first();

        if ($experiencia) {
            $experiencia->delete();
        }

        return response()->json(['ok' => true]);
    }
}
