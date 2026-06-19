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
            ->orderByRaw('COALESCE(fecha_inicio, fecha_fin) DESC')
            ->get();
        return response()->json(['ok' => true, 'experiencias' => $experiencias]);
    }

    public function crear(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tipo'                => 'required|in:laboral,academica',
            'institucion_empresa' => 'required|string|max:150',
            'cargo_titulo'        => 'required|string|max:150',
            'fecha_inicio'        => 'required_if:tipo,laboral|nullable|date',
            'fecha_fin'           => 'nullable|date',
            'descripcion'         => 'nullable|string|max:500',
            'nivel_academico'     => 'nullable|string|max:50',
            'referencias'         => 'nullable|string|max:500',
            'url_certificado'     => 'nullable|url|max:255',
        ], [
            'institucion_empresa.required' => 'El nombre de la empresa o institución es obligatorio',
            'fecha_inicio.required_if'     => 'La fecha de inicio es obligatoria para experiencia laboral',
        ]);

        $validator->after(function ($validator) use ($request) {
            $fechaInicio = $request->input('fecha_inicio');
            $fechaFin = $request->input('fecha_fin');

            if ($fechaInicio && $fechaFin && strtotime($fechaFin) < strtotime($fechaInicio)) {
                $validator->errors()->add('fecha_fin', 'La fecha de fin no puede ser anterior a la fecha de inicio');
            }
        });

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
            'fecha_inicio'        => 'required_if:tipo,laboral|nullable|date',
            'fecha_fin'           => 'nullable|date',
            'descripcion'         => 'nullable|string|max:500',
            'nivel_academico'     => 'nullable|string|max:50',
            'referencias'         => 'nullable|string|max:500',
            'url_certificado'     => 'nullable|url|max:255',
        ], [
            'institucion_empresa.required' => 'El nombre de la empresa o institución es obligatorio',
            'fecha_inicio.required_if'     => 'La fecha de inicio es obligatoria para experiencia laboral',
        ]);

        $validator->after(function ($validator) use ($request) {
            $fechaInicio = $request->input('fecha_inicio');
            $fechaFin = $request->input('fecha_fin');

            if ($fechaInicio && $fechaFin && strtotime($fechaFin) < strtotime($fechaInicio)) {
                $validator->errors()->add('fecha_fin', 'La fecha de fin no puede ser anterior a la fecha de inicio');
            }
        });

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
