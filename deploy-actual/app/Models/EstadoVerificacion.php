<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstadoVerificacion extends Model
{
    protected $table = 'estado_verificacion';
    protected $primaryKey = 'id_estado_verificacion';
    public $timestamps = false;

    protected $fillable = [
        'codigo',
        'nombre',
    ];
}

