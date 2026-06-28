<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExperienciaLaboral extends Model
{
    protected $table = 'experiencia_laboral';
    protected $primaryKey = 'id_experiencia_laboral';
    public $incrementing = false;

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'fecha_actualizacion';

    protected $fillable = [
        'id_experiencia_laboral',
        'usuario_id',
        'empresa',
        'cargo',
        'fecha_inicio',
        'fecha_fin',
        'descripcion',
        'referencias',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id_usuario');
    }
}

