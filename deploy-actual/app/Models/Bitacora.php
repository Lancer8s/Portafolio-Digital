<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bitacora extends Model
{
    protected $table = 'bitacora';
    protected $primaryKey = 'id_bitacora';

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = null;

    protected $fillable = [
        'origen_tabla',
        'origen_id_bitacora',
        'usuario_accion_id',
        'modulo_bitacora_id',
        'accion_bitacora_id',
        'accion',
        'descripcion',
        'valor_anterior',
        'valor_nuevo',
        'fecha',
        'hora',
    ];

    protected $casts = [
        'valor_anterior' => 'array',
        'valor_nuevo' => 'array',
        'fecha' => 'date',
    ];

    public function actor()
    {
        return $this->belongsTo(Usuario::class, 'usuario_accion_id', 'id_usuario');
    }

    public function modulo()
    {
        return $this->belongsTo(ModuloBitacora::class, 'modulo_bitacora_id', 'id_modulo_bitacora');
    }

    public function accionBitacora()
    {
        return $this->belongsTo(AccionBitacora::class, 'accion_bitacora_id', 'id_accion_bitacora');
    }
}

