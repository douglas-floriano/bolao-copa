<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        $list = [
            ['Carlos Silva',    'carlos@bolao.local',    8, 1240],
            ['Beatriz Souza',   'beatriz@bolao.local',   6,  870],
            ['João Pereira',    'joao@bolao.local',      4,  520],
        ];
        foreach ($list as [$name, $email, $level, $xp]) {
            User::updateOrCreate(
                ['email' => $email],
                ['name' => $name, 'password' => 'senha1234', 'is_admin' => false, 'level' => $level, 'xp' => $xp],
            );
        }
    }
}
