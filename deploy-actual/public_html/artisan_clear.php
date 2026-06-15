<?php
/**
 * Elimina el caché de configuración de Laravel directamente.
 * No necesita que Laravel funcione — borra los archivos físicamente.
 * ELIMINAR DEL SERVIDOR DESPUÉS DE USAR.
 */

if (!isset($_GET['key']) || $_GET['key'] !== 'borrar2024') {
    http_response_code(403);
    die('Acceso denegado. Usa: ?key=borrar2024');
}

// Ruta raíz de Laravel (un nivel arriba de public_html/)
$basePath = dirname(__DIR__);
$cachePath = $basePath . '/bootstrap/cache';
$rateLimitCachePath = $basePath . '/storage/framework/cache/data';

$archivos = [
    'config.php',
    'packages.php',
    'services.php',
    'routes-v7.php',
    'events.php',
];

echo "<html><body style='font-family:monospace;background:#1a1a2e;color:#eee;padding:20px'>";
echo "<h2 style='color:#00ff88'>🗑️ Limpiando caché de Laravel</h2>";
echo "<pre style='background:#0d0d1a;padding:15px;border-radius:8px'>";
echo "Ruta base detectada: $basePath\n";
echo "Ruta caché: $cachePath\n\n";

foreach ($archivos as $archivo) {
    $ruta = $cachePath . '/' . $archivo;
    if (file_exists($ruta)) {
        if (unlink($ruta)) {
            echo "✅ Eliminado: bootstrap/cache/$archivo\n";
        } else {
            echo "❌ No se pudo eliminar: bootstrap/cache/$archivo (sin permisos)\n";
        }
    } else {
        echo "⚪ No existe: bootstrap/cache/$archivo\n";
    }
}

echo "\n--- Limpiando cache de rate limits ---\n";
if (is_dir($rateLimitCachePath)) {
    $items = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($rateLimitCachePath, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );

    foreach ($items as $item) {
        if ($item->isFile()) {
            @unlink($item->getPathname());
        } elseif ($item->isDir()) {
            @rmdir($item->getPathname());
        }
    }
    echo "Cache de rate limits limpiada: $rateLimitCachePath\n";
} else {
    echo "No existe storage/framework/cache/data\n";
}

if (function_exists('opcache_reset')) {
    @opcache_reset();
    echo "OPcache reseteado\n";
}

echo "\n--- Verificando .env ---\n";
$envPath = $basePath . '/.env';
if (file_exists($envPath)) {
    $env = file_get_contents($envPath);
    preg_match('/DB_HOST=(.+)/', $env, $m);
    preg_match('/APP_URL=(.+)/', $env, $u);
    preg_match('/GITHUB_CLIENT_ID=(.+)/', $env, $g);
    echo "DB_HOST encontrado en .env:      " . trim($m[1] ?? 'NO ENCONTRADO') . "\n";
    echo "APP_URL encontrado en .env:      " . trim($u[1] ?? 'NO ENCONTRADO') . "\n";
    echo "GITHUB_CLIENT_ID en .env:        " . trim($g[1] ?? 'NO ENCONTRADO') . "\n";
} else {
    echo "❌ .env NO encontrado en: $envPath\n";
}

echo "</pre>";
echo "<p style='color:#00ff88;font-weight:bold'>✅ Listo. Ahora prueba el login con GitHub.</p>";
echo "<p style='color:#ff4444;font-weight:bold'>⚠️ ELIMINA ESTE ARCHIVO DEL SERVIDOR AHORA.</p>";
echo "</body></html>";
