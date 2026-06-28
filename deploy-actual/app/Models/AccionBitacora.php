<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccionBitacora extends Model
{
    protected $table = 'accion_bitacora';
    protected $primaryKey = 'id_accion_bitacora';
    public $timestamps = false;

    protected $fillable = [
        'codigo',
        'nombre',
    ];
}

