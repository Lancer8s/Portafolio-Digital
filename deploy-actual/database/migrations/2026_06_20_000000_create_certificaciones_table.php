<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCertificacionesTable extends Migration
{
    public function up()
    {
        Schema::create('certificaciones', function (Blueprint $table) {
            $table->id();
            $table->integer('user_id');
            $table->string('titulo', 150);
            $table->string('institucion', 150);
            $table->date('fecha_emision');
            $table->string('descripcion', 500)->nullable();
            $table->timestamps();

            $table->foreign('user_id')
                ->references('id_usuario')
                ->on('usuario')
                ->onDelete('cascade');
            $table->index(['user_id', 'fecha_emision']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('certificaciones');
    }
}
