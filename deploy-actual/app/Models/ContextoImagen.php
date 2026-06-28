<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContextoImagen extends Model
{
    protected $table = 'contexto_imagen';
    protected $primaryKey = 'id_contexto_imagen';
    public $timestamps = false;

    protected $fillable = [
        'codigo',
        'nombre',
    ];
}

