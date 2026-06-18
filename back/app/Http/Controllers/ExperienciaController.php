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
        $idUsuario = $request->user()->id_usuario;
        $experiencias = Experiencia::where('id_usuario', $idUsuario)
            ->orderBy('fecha_inicio', 'desc')
            ->get();
        return response()->json(['ok' => true, 'experiencias' => $experiencias]);
    }

    public function crear(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tipo'                => 'required|in:laboral,academica',
            'institucion_empresa' => 'required|string|max:150',
            'cargo_titulo'        => 'required|string|max:150',
            'fecha_inicio'        => 'required|date',
            'fecha_fin'           => 'nullable|date|after_or_equal:fecha_inicio',
            'descripcion'         => 'nullable|string',
            'nivel_academico'     => 'nullable|string|max:50',
            'referencias'         => 'nullable|string|max:500',
        ], [
            'institucion_empresa.required' => 'El nombre de la empresa o institución es obligatorio',
            'fecha_fin.after_or_equal'     => 'La fecha de fin no puede ser anterior a la fecha de inicio',
        ]);

        if ($validator->fails()) {
            return response()->json(['ok' => false, 'errores' => $validator->errors()], 422);
        }

        $experiencia = new Experiencia($request->all());
        $experiencia->id_usuario = $request->user()->id_usuario;
        $experiencia->save();

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
            'tipo'                => 'required|in:laboral,academica',
            'institucion_empresa' => 'required|string|max:150',
            'cargo_titulo'        => 'required|string|max:150',
            'fecha_inicio'        => 'required|date',
            'fecha_fin'           => 'nullable|date|after_or_equal:fecha_inicio',
            'descripcion'         => 'nullable|string',
            'nivel_academico'     => 'nullable|string|max:50',
            'referencias'         => 'nullable|string|max:500',
        ], [
            'institucion_empresa.required' => 'El nombre de la empresa o institución es obligatorio',
            'fecha_fin.after_or_equal'     => 'La fecha de fin no puede ser anterior a la fecha de inicio',
        ]);

        if ($validator->fails()) {
            return response()->json(['ok' => false, 'errores' => $validator->errors()], 422);
        }

        $experiencia->update($request->all());

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
