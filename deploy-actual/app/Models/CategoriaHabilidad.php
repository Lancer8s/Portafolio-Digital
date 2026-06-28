<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoriaHabilidad extends Model
{
    protected $table = 'categoria_habilidad';
    protected $primaryKey = 'id_categoria_habilidad';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
    ];
}

