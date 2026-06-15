<?php
/**
 * Script de diagnóstico y reparación del .env del servidor.
 * ELIMINAR DESPUÉS DE USAR.
 */

if (!isset($_GET['key']) || $_GET['key'] !== 'fix2024') {
    http_response_code(403);
    die('Acceso denegado. Usa: ?key=fix2024');
}

$basePath  = dirname(__DIR__); // /hosting/leticia/aidsoft
$envPath   = $basePath . '/.env';
$cachePath = $basePath . '/bootstrap/cache';

echo "<html><body style='font-family:monospace;background:#0d1117;color:#c9d1d9;padding:20px;font-size:14px'>";
echo "<h2 style='color:#3fb950'>🔧 Diagnóstico y reparación del servidor</h2>";

// ── 1. Leer .env actual ──────────────────────────────────────────
echo "<h3 style='color:#d29922'>📄 Contenido actual del .env:</h3>";
echo "<pre style='background:#161b22;padding:15px;border-radius:6px;border:1px solid #30363d'>";

if (!file_exists($envPath)) {
    echo "❌ .env NO encontrado en: $envPath\n";
} else {
    $envContent = file_get_contents($envPath);
    // Mostrar solo líneas relevantes (ocultar datos sensibles parcialmente)
    $lines = explode("\n", $envContent);
    foreach ($lines as $line) {
        $line = rtrim($line);
        if (str_starts_with($line, 'DB_') ||
            str_starts_with($line, 'APP_URL') ||
            str_starts_with($line, 'GITHUB_') ||
            str_starts_with($line, 'FRONTEND_') ||
            str_starts_with($line, 'APP_ENV') ||
            str_starts_with($line, 'SANCTUM_')) {
            echo htmlspecialchars($line) . "\n";
        }
    }
}
echo "</pre>";

// ── 2. Reparar DB_HOST si es "postgres" ─────────────────────────
echo "<h3 style='color:#d29922'>🔨 Reparación automática:</h3>";
echo "<pre style='background:#161b22;padding:15px;border-radius:6px;border:1px solid #30363d'>";

if (file_exists($envPath)) {
    $envContent = file_get_contents($envPath);
    $reparado   = false;

    // Corregir DB_HOST=postgres → 127.0.0.1
    if (preg_match('/DB_HOST=postgres/i', $envContent)) {
        $envContent = preg_replace('/DB_HOST=postgres/i', 'DB_HOST=127.0.0.1', $envContent);
        $reparado   = true;
        echo "✅ DB_HOST corregido: postgres → 127.0.0.1\n";
    } else {
        preg_match('/DB_HOST=(.+)/', $envContent, $m);
        echo "ℹ️  DB_HOST ya es: " . trim($m[1] ?? '???') . "\n";
    }

    if ($reparado) {
        file_put_contents($envPath, $envContent);
        echo "✅ .env guardado correctamente.\n";
    }
} else {
    echo "❌ No se puede reparar — .env no encontrado.\n";
}

// ── 3. Eliminar archivos de caché ────────────────────────────────
echo "\n--- Eliminando caché de configuración ---\n";
$cacheFiles = ['config.php', 'packages.php', 'services.php', 'routes-v7.php', 'events.php'];

foreach ($cacheFiles as $file) {
    $path = $cachePath . '/' . $file;
    if (file_exists($path)) {
        echo unlink($path)
            ? "✅ Eliminado: bootstrap/cache/$file\n"
            : "❌ Sin permisos: bootstrap/cache/$file\n";
    } else {
        echo "⚪ No existe: bootstrap/cache/$file\n";
    }
}

echo "</pre>";
echo "<h3 style='color:#3fb950'>✅ Proceso completado.</h3>";
echo "<p>Ahora prueba el login con GitHub.</p>";
echo "<p style='color:#f85149;font-weight:bold'>⚠️ ELIMINA ESTE ARCHIVO DEL SERVIDOR INMEDIATAMENTE.</p>";
echo "</body></html>";
