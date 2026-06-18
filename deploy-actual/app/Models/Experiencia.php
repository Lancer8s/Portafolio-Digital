<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Experiencia extends Model
{
    protected $table = 'experiencia';
    protected $primaryKey = 'id_experiencia';
    public $timestamps = false; // Manejado por fecha_registro

    protected $fillable = [
        'id_usuario',
        'tipo',
        'institucion_empresa',
        'cargo_titulo',
        'fecha_inicio',
        'fecha_fin',
        'descripcion',
        'nivel_academico',
        'referencias',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }
}
