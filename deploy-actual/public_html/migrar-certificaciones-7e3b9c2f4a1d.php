<?php

declare(strict_types=1);

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;

const MIGRATION_KEY_HASH = '5daa369a7e7e8ee4433e24c62a5989e160dd96c1bd7b28fc1e1afa78d9212070';
const MIGRATION_PATH = 'database/migrations/2026_06_20_000000_create_certificaciones_table.php';

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow, noarchive');

function respond(int $status, string $title, string $message, string $output = ''): void
{
    http_response_code($status);

    $safeTitle = htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeMessage = htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeOutput = htmlspecialchars($output, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    echo '<!doctype html><html lang="es"><head><meta charset="utf-8">';
    echo '<meta name="viewport" content="width=device-width,initial-scale=1">';
    echo '<title>'.$safeTitle.'</title>';
    echo '<style>body{font-family:system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 20px;color:#172033}';
    echo 'pre{white-space:pre-wrap;background:#111827;color:#e5e7eb;padding:18px;border-radius:10px;overflow:auto}';
    echo '.notice{padding:14px 16px;background:#eff6ff;border:1px solid #93c5fd;border-radius:10px}</style></head><body>';
    echo '<h1>'.$safeTitle.'</h1><p class="notice">'.$safeMessage.'</p>';

    if ($safeOutput !== '') {
        echo '<h2>Salida de Artisan</h2><pre>'.$safeOutput.'</pre>';
    }

    echo '</body></html>';
    exit;
}

function sanitizeArtisanOutput(string $output): string
{
    $sensitiveValues = [];

    foreach (['host', 'database', 'username', 'password'] as $field) {
        $value = config('database.connections.pgsql.'.$field);

        if (is_string($value) && strlen($value) >= 3) {
            $sensitiveValues[] = $value;
        }
    }

    usort($sensitiveValues, static function (string $left, string $right): int {
        return strlen($right) <=> strlen($left);
    });

    return str_replace(array_unique($sensitiveValues), '[oculto]', $output);
}

$providedKey = isset($_GET['key']) ? (string) $_GET['key'] : '';

if ($providedKey === '' || !hash_equals(MIGRATION_KEY_HASH, hash('sha256', $providedKey))) {
    respond(403, 'Acceso denegado', 'La clave proporcionada no es válida. No se ejecutó ninguna operación.');
}

$lockPath = __DIR__.'/../storage/app/certificaciones-migration-20260620.lock';
$lockHandle = @fopen($lockPath, 'x');

if ($lockHandle === false) {
    respond(409, 'Ejecución bloqueada', 'Este ejecutor ya fue utilizado o no pudo crear su bloqueo de seguridad. La migración no volvió a ejecutarse.');
}

fwrite($lockHandle, gmdate('c').PHP_EOL);
fclose($lockHandle);

$artisanOutput = '';
$exitCode = 1;

try {
    require __DIR__.'/../vendor/autoload.php';
    $app = require __DIR__.'/../bootstrap/app.php';
    $kernel = $app->make(Kernel::class);
    $kernel->bootstrap();

    $exitCode = Artisan::call('migrate', [
        '--path' => MIGRATION_PATH,
        '--force' => true,
    ]);
    $artisanOutput = sanitizeArtisanOutput(Artisan::output());
} catch (Throwable $exception) {
    $artisanOutput = 'La ejecución terminó con una excepción. No se muestran detalles para evitar exponer la configuración del servidor.';
}

$selfDeleted = @unlink(__FILE__);

if ($exitCode === 0) {
    respond(
        200,
        'Migración finalizada',
        $selfDeleted
            ? 'Se ejecutó únicamente la migración de certificaciones y el ejecutor se autoeliminó.'
            : 'Se ejecutó únicamente la migración de certificaciones. Elimina inmediatamente este archivo mediante FTP.',
        $artisanOutput
    );
}

respond(
    500,
    'La migración no finalizó correctamente',
    $selfDeleted
        ? 'El ejecutor se autoeliminó y su clave quedó consumida. Revisa los registros privados de Laravel.'
        : 'La clave quedó consumida. Elimina inmediatamente este archivo mediante FTP y revisa los registros privados de Laravel.',
    $artisanOutput
);
