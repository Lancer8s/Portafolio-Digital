<?php
/**
 * migrate_experiencia.php
 * Agrega columnas complementarias a la tabla experiencia y permite fecha_inicio nula.
 * EJECUTAR UNA SOLA VEZ, luego eliminar del servidor por seguridad.
 */

// Carga la configuracion de Laravel para obtener las credenciales de BD.
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$pdo = DB::connection()->getPdo();
$driver = DB::connection()->getDriverName();

$sqls = [
    "ALTER TABLE experiencia ADD COLUMN IF NOT EXISTS nivel_academico VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE experiencia ADD COLUMN IF NOT EXISTS referencias TEXT DEFAULT NULL",
    "ALTER TABLE experiencia ADD COLUMN IF NOT EXISTS url_certificado VARCHAR(255) DEFAULT NULL",
];

if ($driver === 'pgsql') {
    $sqls[] = "ALTER TABLE experiencia ALTER COLUMN fecha_inicio DROP NOT NULL";
} else {
    $sqls[] = "ALTER TABLE experiencia MODIFY COLUMN fecha_inicio DATE NULL";
}

echo "<pre style='font-family:monospace;font-size:14px;padding:20px'>";
echo "<b>Migracion: ajustes en tabla experiencia</b>\n\n";
echo "Driver BD: $driver\n\n";

foreach ($sqls as $sql) {
    try {
        $pdo->exec($sql);
        echo "OK: $sql\n";
    } catch (Exception $e) {
        echo "ERROR: " . $e->getMessage() . "\n   SQL: $sql\n";
    }
}

echo "\n<b>Listo. Elimina este archivo del servidor.</b>";
echo "</pre>";
