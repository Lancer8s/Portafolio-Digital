<?php
// Función para borrar carpetas bloqueadas recursivamente
function borrar_todo($dir) {
    if (!is_dir($dir)) return;
    foreach(scandir($dir) as $file) {
        if ('.' === $file || '..' === $file) continue;
        if (is_dir("$dir/$file")) borrar_todo("$dir/$file");
        else @unlink("$dir/$file");
    }
    @rmdir($dir);
}

echo "<h3>Paso 1: Forzando eliminacion de carpetas bloqueadas...</h3>";
$carpetas_problematicas = [
    __DIR__ . '/../storage/framework',
    __DIR__ . '/../bootstrap/cache'
];

foreach ($carpetas_problematicas as $dir) {
    borrar_todo($dir);
    echo "✔️ Limpiado: $dir <br>";
}

echo "<h3>Paso 2: Recreando todo con permisos puros...</h3>";
$directorios = [
    __DIR__ . '/../storage',
    __DIR__ . '/../storage/app',
    __DIR__ . '/../storage/app/public',
    __DIR__ . '/../storage/framework',
    __DIR__ . '/../storage/framework/cache',
    __DIR__ . '/../storage/framework/cache/data',
    __DIR__ . '/../storage/framework/sessions',
    __DIR__ . '/../storage/framework/views',
    __DIR__ . '/../storage/logs',
    __DIR__ . '/../bootstrap/cache',
];

foreach ($directorios as $dir) {
    if (!file_exists($dir)) {
        if (@mkdir($dir, 0777, true)) {
            echo "✅ Creado exitosamente: $dir <br>";
        } else {
            echo "❌ Fallo al crear: $dir <br>";
        }
    } else {
        @chmod($dir, 0777);
    }
}
echo "<h3>¡Proceso terminado! Ya puedes intentar abrir tu página.</h3>";
?>
