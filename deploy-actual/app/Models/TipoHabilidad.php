<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoHabilidad extends Model
{
    protected $table = 'tipo_habilidad';
    protected $primaryKey = 'id_tipo_habilidad';
    public $timestamps = false;

    protected $fillable = [
        'codigo',
        'nombre',
    ];
}

