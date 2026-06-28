<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FormacionAcademica extends Model
{
    protected $table = 'formacion_academica';
    protected $primaryKey = 'id_formacion_academica';
    public $incrementing = false;

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'fecha_actualizacion';

    protected $fillable = [
        'id_formacion_academica',
        'usuario_id',
        'institucion',
        'titulo',
        'nivel_academico_id',
        'fecha_inicio',
        'fecha_fin',
        'descripcion',
        'url_certificado',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id_usuario');
    }

    public function nivelAcademico()
    {
        return $this->belongsTo(NivelAcademico::class, 'nivel_academico_id', 'id_nivel_academico');
    }
}

