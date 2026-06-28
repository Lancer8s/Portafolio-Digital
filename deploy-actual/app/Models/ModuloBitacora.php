<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModuloBitacora extends Model
{
    protected $table = 'modulo_bitacora';
    protected $primaryKey = 'id_modulo_bitacora';
    public $timestamps = false;

    protected $fillable = [
        'codigo',
        'nombre',
    ];
}

