<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run()
    {
        $admin = Usuario::where('email', 'admin@gmail.com')->first();
        if (!$admin) {
            $admin = new Usuario();
            $admin->nombre = 'Admin';
            $admin->apellido = 'Sistema';
            $admin->email = 'admin@gmail.com';
            $admin->password_hash = Hash::make('admin123');
            $admin->activo = true;
            $admin->save();

            DB::table('rol_usuario')->insert([
                'id_usuario' => $admin->id_usuario,
                'id_rol' => 2
            ]);
        }
    }
}
