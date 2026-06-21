<?php

namespace App\Http\Controllers;

use App\Models\Certificacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CertificacionController extends Controller
{
    public function listar(Request $request)
    {
        $certificaciones = Certificacion::where('user_id', $request->user()->id_usuario)
            ->orderByDesc('fecha_emision')
            ->orderByDesc('id')
            ->get();

        return response()->json(['ok' => true, 'certificaciones' => $certificaciones]);
    }

    public function crear(Request $request)
    {
        $validator = $this->validar($request);

        if ($validator->fails()) {
            return response()->json(['ok' => false, 'errores' => $validator->errors()], 422);
        }

        $certificacion = new Certificacion($validator->validated());
        $certificacion->user_id = $request->user()->id_usuario;
        $certificacion->save();

        return response()->json(['ok' => true, 'certificacion' => $certificacion], 201);
    }

    public function actualizar(Request $request, $id)
    {
        $certificacion = $this->buscarDelUsuario($request, $id);

        if (!$certificacion) {
            return response()->json(['ok' => false, 'mensaje' => 'Certificación no encontrada'], 404);
        }

        $validator = $this->validar($request);

        if ($validator->fails()) {
            return response()->json(['ok' => false, 'errores' => $validator->errors()], 422);
        }

        $certificacion->update($validator->validated());

        return response()->json(['ok' => true, 'certificacion' => $certificacion]);
    }

    public function eliminar(Request $request, $id)
    {
        $certificacion = $this->buscarDelUsuario($request, $id);

        if (!$certificacion) {
            return response()->json(['ok' => false, 'mensaje' => 'Certificación no encontrada'], 404);
        }

        $certificacion->delete();

        return response()->json(['ok' => true]);
    }

    private function buscarDelUsuario(Request $request, $id)
    {
        return Certificacion::where('id', $id)
            ->where('user_id', $request->user()->id_usuario)
            ->first();
    }

    private function validar(Request $request)
    {
        return Validator::make($request->all(), [
            'titulo' => 'required|string|max:150',
            'institucion' => 'required|string|max:150',
            'fecha_emision' => 'required|date',
            'descripcion' => 'nullable|string|max:500',
        ], [
            'titulo.required' => 'El título es obligatorio',
            'institucion.required' => 'La institución es obligatoria',
            'fecha_emision.required' => 'La fecha de emisión es obligatoria',
        ]);
    }
}
