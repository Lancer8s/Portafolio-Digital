<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PerfilUsuario extends Model
{
    protected $table = 'perfil_usuario';
    protected $primaryKey = 'id_perfil';

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'fecha_actualizacion';

    protected $fillable = [
        'usuario_id',
        'profesion',
        'titulo_profesional',
        'biografia',
        'telefono',
        'visibilidad_id',
        'imagen_perfil_id',
        'nombre_modificado',
    ];

    protected $casts = [
        'nombre_modificado' => 'boolean',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id_usuario');
    }

    public function visibilidad()
    {
        return $this->belongsTo(VisibilidadPerfil::class, 'visibilidad_id', 'id_visibilidad');
    }

    public function imagenPerfil()
    {
        return $this->belongsTo(Imagen::class, 'imagen_perfil_id', 'id_imagen');
    }
}

