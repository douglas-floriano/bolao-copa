<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@bolaocopa.local'],
            [
                'name' => 'Admin Bolão',
                'password' => 'admin1234', // hashed via cast
                'is_admin' => true,
            ]
        );
    }
}
