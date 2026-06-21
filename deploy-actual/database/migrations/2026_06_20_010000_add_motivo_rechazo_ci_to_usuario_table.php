<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddMotivoRechazoCiToUsuarioTable extends Migration
{
    public function up()
    {
        Schema::table('usuario', function (Blueprint $table) {
            $table->text('motivo_rechazo_ci')->nullable();
        });
    }

    public function down()
    {
        Schema::table('usuario', function (Blueprint $table) {
            $table->dropColumn('motivo_rechazo_ci');
        });
    }
}
