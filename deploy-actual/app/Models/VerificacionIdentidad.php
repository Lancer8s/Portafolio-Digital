<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VerificacionIdentidad extends Model
{
    protected $table = 'verificacion_identidad';
    protected $primaryKey = 'id_verificacion';

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'fecha_actualizacion';

    protected $fillable = [
        'usuario_id',
        'imagen_ci_id',
        'estado_verificacion_id',
        'motivo_rechazo',
        'fecha_envio',
        'fecha_revision',
    ];

    protected $casts = [
        'fecha_envio' => 'datetime',
        'fecha_revision' => 'datetime',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id_usuario');
    }

    public function estado()
    {
        return $this->belongsTo(EstadoVerificacion::class, 'estado_verificacion_id', 'id_estado_verificacion');
    }

    public function imagenCi()
    {
        return $this->belongsTo(Imagen::class, 'imagen_ci_id', 'id_imagen');
    }
}

