<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Certificacion extends Model
{
    protected $table = 'certificaciones';

    protected $fillable = [
        'user_id',
        'titulo',
        'institucion',
        'fecha_emision',
        'descripcion',
    ];

    protected $casts = [
        'fecha_emision' => 'date',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'user_id', 'id_usuario');
    }
}
