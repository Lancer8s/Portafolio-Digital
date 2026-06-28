<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CertificacionNormalizada extends Model
{
    protected $table = 'certificacion';
    protected $primaryKey = 'id_certificacion';
    public $incrementing = false;

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'fecha_actualizacion';

    protected $fillable = [
        'id_certificacion',
        'usuario_id',
        'titulo',
        'institucion',
        'fecha_emision',
        'descripcion',
    ];

    protected $casts = [
        'fecha_emision' => 'date',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id_usuario');
    }
}

