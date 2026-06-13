<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Sirve el index.html del frontend React para todas las rutas web.
| Esto permite que React Router maneje la navegación del lado del cliente
| sin errores 404 al refrescar la página o acceder directamente a una ruta.
|
*/

Route::get('/{any}', function () {
    return view('index');
})->where('any', '.*');
