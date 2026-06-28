<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Imagen extends Model
{
    protected $table = 'imagen';
    protected $primaryKey = 'id_imagen';
    public $timestamps = false;

    protected $fillable = [
        'ruta',
        'nombre',
        'tipo',
        'tamanio_kb',
        'contexto',
        'contexto_imagen_id',
        'fecha_subida',
    ];

    protected $casts = [
        'fecha_subida' => 'datetime',
    ];

    public function contextoImagen()
    {
        return $this->belongsTo(ContextoImagen::class, 'contexto_imagen_id', 'id_contexto_imagen');
    }
}

