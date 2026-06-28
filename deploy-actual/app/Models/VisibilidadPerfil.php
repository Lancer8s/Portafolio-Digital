<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VisibilidadPerfil extends Model
{
    protected $table = 'visibilidad_perfil';
    protected $primaryKey = 'id_visibilidad';
    public $timestamps = false;

    protected $fillable = [
        'codigo',
        'nombre',
    ];
}

