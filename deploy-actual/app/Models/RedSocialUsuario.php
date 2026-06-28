<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RedSocialUsuario extends Model
{
    protected $table = 'red_social_usuario';
    protected $primaryKey = 'id_red_social_usuario';

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = null;

    protected $fillable = [
        'usuario_id',
        'tipo_red_social_id',
        'url',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id_usuario');
    }

    public function tipo()
    {
        return $this->belongsTo(TipoRedSocial::class, 'tipo_red_social_id', 'id_tipo_red_social');
    }
}

