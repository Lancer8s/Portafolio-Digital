<?php
/**
 * migrate_experiencia.php
 * Agrega las columnas nivel_academico y referencias a la tabla experiencia.
 * EJECUTAR UNA SOLA VEZ, luego eliminar del servidor por seguridad.
 */

// Carga la configuración de Laravel para obtener las credenciales de BD
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$pdo = DB::connection()->getPdo();

$sqls = [
    "ALTER TABLE experiencia ADD COLUMN IF NOT EXISTS nivel_academico VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE experiencia ADD COLUMN IF NOT EXISTS referencias TEXT DEFAULT NULL",
];

echo "<pre style='font-family:monospace;font-size:14px;padding:20px'>";
echo "<b>Migración: columnas nuevas en tabla experiencia</b>\n\n";

foreach ($sqls as $sql) {
    try {
        $pdo->exec($sql);
        echo "✅ OK: $sql\n";
    } catch (Exception $e) {
        echo "❌ ERROR: " . $e->getMessage() . "\n   SQL: $sql\n";
    }
}

echo "\n<b>Listo. Elimina este archivo del servidor.</b>";
echo "</pre>";
