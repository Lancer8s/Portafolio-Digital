<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CuentaUsuario extends Model
{
    protected $table = 'cuenta_usuario';
    protected $primaryKey = 'usuario_id';
    public $incrementing = false;

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'fecha_actualizacion';

    protected $fillable = [
        'usuario_id',
        'correo',
        'contrasena_hash',
        'activo',
    ];

    protected $hidden = [
        'contrasena_hash',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id_usuario');
    }
}

