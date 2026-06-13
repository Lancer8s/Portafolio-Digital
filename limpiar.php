<?php
// Script de limpieza del servidor - USO ÚNICO
// Elimina todos los archivos sueltos en la raíz del servidor
// (los que quedaron mal del ZIP de Windows)

$token = $_GET['ok'] ?? '';
if ($token !== 'limpiar2024') {
    die('Acceso denegado. Agrega ?ok=limpiar2024 a la URL para ejecutar.');
}

// Directorio raíz de la cuenta FTP (un nivel arriba de public_html)
$root = dirname(__DIR__); // /home/aidsoft o equivalente

// Carpetas que NO se deben tocar
$proteger = ['logs', 'public_html', '.', '..'];

$eliminados = 0;
$errores = [];

echo "<pre>";
echo "Raiz del servidor: $root\n\n";

$items = scandir($root);
foreach ($items as $item) {
    if (in_array($item, $proteger)) {
        echo "PROTEGIDO: $item\n";
        continue;
    }

    $ruta = $root . '/' . $item;

    if (is_dir($ruta)) {
        // Eliminar carpeta y todo su contenido
        if (eliminarDirectorio($ruta)) {
            echo "CARPETA ELIMINADA: $item\n";
            $eliminados++;
        } else {
            $errores[] = "No se pudo eliminar carpeta: $item";
            echo "ERROR al eliminar carpeta: $item\n";
        }
    } else {
        // Eliminar archivo
        if (unlink($ruta)) {
            echo "ARCHIVO ELIMINADO: $item\n";
            $eliminados++;
        } else {
            $errores[] = "No se pudo eliminar: $item";
            echo "ERROR al eliminar: $item\n";
        }
    }
}

echo "\n======================\n";
echo "Total eliminados: $eliminados\n";
if (!empty($errores)) {
    echo "Errores: " . count($errores) . "\n";
    foreach ($errores as $e) echo "  - $e\n";
}
echo "\nListo! Ahora sube el backend_laravel.zip correctamente.\n";
echo "</pre>";

function eliminarDirectorio($dir) {
    if (!is_dir($dir)) return false;
    $items = scandir($dir);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        $ruta = $dir . '/' . $item;
        if (is_dir($ruta)) {
            eliminarDirectorio($ruta);
        } else {
            unlink($ruta);
        }
    }
    return rmdir($dir);
}
