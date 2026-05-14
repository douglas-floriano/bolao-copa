<?php

namespace Database\Seeders;

use App\Models\Championship;
use Illuminate\Database\Seeder;

class ChampionshipSeeder extends Seeder
{
    public function run(): void
    {
        Championship::updateOrCreate(
            ['slug' => 'copa-2026'],
            [
                'name' => 'Copa do Mundo FIFA 2026',
                'mode' => 'full',
                'points_exact' => 5,
                'points_winner' => 2,
                'lock_minutes' => 60,
                'active' => true,
                'start_date' => '2026-06-11',
                'end_date'   => '2026-07-19',
            ]
        );
    }
}
