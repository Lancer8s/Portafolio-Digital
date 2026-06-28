<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoRedSocial extends Model
{
    protected $table = 'tipo_red_social';
    protected $primaryKey = 'id_tipo_red_social';
    public $timestamps = false;

    protected $fillable = [
        'codigo',
        'nombre',
    ];
}

