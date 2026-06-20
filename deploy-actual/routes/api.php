<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\HabilidadController;
use App\Http\Controllers\ProyectoController;
use App\Http\Controllers\ExperienciaController;
use App\Http\Controllers\AdminController;

/*
|--------------------------------------------------------------------------
| API Routes — Sistema de Portafolios Digitales
|--------------------------------------------------------------------------
|
|  Prefijo global: /api  (configurado en RouteServiceProvider)
|
|  ── Pública ───────────────────────────────────────────────────────────
|  POST   /api/auth/registro
|  POST   /api/auth/login
|  GET    /api/auth/github              → redirige a GitHub OAuth
|  GET    /api/auth/github/callback     → callback de GitHub OAuth
|  GET    /api/habilidades/catalogo
|
|  ── Protegida (Sanctum) ────────────────────────────────────────────────
|  GET    /api/auth/me
|  POST   /api/auth/logout
|
|  GET    /api/usuario/perfil
|  PUT    /api/usuario/perfil
|  POST   /api/usuario/foto
|  PUT    /api/usuario/password
|  DELETE /api/usuario
|
|  GET    /api/habilidades
|  POST   /api/habilidades
|  POST   /api/habilidades/personalizada
|  PUT    /api/habilidades/{id}/nivel
|  DELETE /api/habilidades/{id}
|  PUT    /api/habilidades/sincronizar
|
|  GET    /api/proyectos
|  POST   /api/proyectos
|  GET    /api/proyectos/{id}
|  PUT    /api/proyectos/{id}
|  DELETE /api/proyectos/{id}
|  POST   /api/proyectos/{id}/imagenes
|  DELETE /api/proyectos/{id}/imagenes/{idImagen}
|  PUT    /api/proyectos/{id}/habilidades
|
*/

// ── Rutas públicas ───────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('registro', [AuthController::class, 'registro']);
    Route::post('login',    [AuthController::class, 'login']);

    // GitHub OAuth
    Route::get('github',          [AuthController::class, 'githubRedirect']);
    Route::get('github/callback', [AuthController::class, 'githubCallback']);
});

// Catálogo de habilidades (no requiere auth)
Route::get('habilidades/catalogo', [HabilidadController::class, 'catalogo']);

// Portafolio público (acepta auth opcional para detectar si es el dueño)
Route::get('portafolio/{id}', [UsuarioController::class, 'perfilPublico']);

// Búsqueda pública de portafolios (no requiere auth)
Route::get('portafolios/buscar', [UsuarioController::class, 'buscarPortafolios']);

// ── Rutas para Servir Archivos (Soluciona problema de symlinks en Windows/Docker) ──
Route::get('media/{path}', function ($path) {
    if (!\Illuminate\Support\Facades\Storage::disk('public')->exists($path)) {
        abort(404);
    }
    $file = \Illuminate\Support\Facades\Storage::disk('public')->get($path);
    $type = \Illuminate\Support\Facades\Storage::disk('public')->mimeType($path);
    return response($file, 200)->header('Content-Type', $type);
})->where('path', '.*');

// ── Rutas protegidas ─────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('auth/me',      [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    // Usuario
    Route::prefix('usuario')->group(function () {
        Route::get('perfil',     [UsuarioController::class, 'perfil']);
        Route::put('perfil',     [UsuarioController::class, 'actualizarPerfil']);
        Route::post('perfil',    [UsuarioController::class, 'actualizarPerfil']);
        Route::post('foto',      [UsuarioController::class, 'actualizarFoto']);
        Route::post('ci',        [UsuarioController::class, 'actualizarCI']);
        Route::put('password',   [UsuarioController::class, 'cambiarPassword']);
        Route::delete('/',       [UsuarioController::class, 'desactivar']);
    });

    // Habilidades
    Route::prefix('habilidades')->group(function () {
        Route::get('/',                         [HabilidadController::class, 'listar']);
        Route::get('catalogo-usuario',          [HabilidadController::class, 'catalogoUsuario']);
        Route::post('/',                        [HabilidadController::class, 'agregar']);
        Route::post('personalizada',            [HabilidadController::class, 'agregarPersonalizada']);
        Route::put('sincronizar',               [HabilidadController::class, 'sincronizar']);
        Route::put('{idHabilidad}/nivel',       [HabilidadController::class, 'editarNivel']);
        Route::delete('{idHabilidad}',          [HabilidadController::class, 'eliminar']);
    });

    // Experiencias
    Route::prefix('experiencias')->group(function () {
        Route::get('/', [ExperienciaController::class, 'listar']);
        Route::post('/', [ExperienciaController::class, 'crear']);
        Route::put('{id}', [ExperienciaController::class, 'actualizar']);
        Route::delete('{id}', [ExperienciaController::class, 'eliminar']);
    });

    // Proyectos
    Route::prefix('proyectos')->group(function () {
        Route::get('/',                             [ProyectoController::class, 'listar']);
        Route::post('/',                            [ProyectoController::class, 'crear']);
        Route::put('visibilidad-multiple',          [ProyectoController::class, 'toggleVisibilidadMultiple']);
        Route::get('{idProyecto}',                  [ProyectoController::class, 'obtener']);
        Route::put('{idProyecto}',                  [ProyectoController::class, 'actualizar']);
        Route::delete('{idProyecto}',               [ProyectoController::class, 'eliminar']);
        Route::post('{idProyecto}/imagenes',        [ProyectoController::class, 'agregarImagen']);
        Route::delete('{idProyecto}/imagenes/{idImagen}', [ProyectoController::class, 'eliminarImagen']);
        Route::put('{idProyecto}/habilidades',      [ProyectoController::class, 'sincronizarHabilidades']);
        Route::put('{idProyecto}/visibilidad',       [ProyectoController::class, 'toggleVisibilidad']);
    });

    // Admin
    Route::prefix('admin')->group(function () {
        Route::get('ci-pending', [AdminController::class, 'getPendingCI']);
        Route::put('ci-verify/{id}', [AdminController::class, 'verifyCI']);
        Route::get('estadisticas', [AdminController::class, 'getEstadisticas']);
        Route::get('bitacoras/{tabla}', [AdminController::class, 'getBitacoras']);
        Route::get('bitacoras/{tabla}/export', [AdminController::class, 'exportBitacoraCSV']);
    });
});
