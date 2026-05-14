<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ChampionshipSeeder::class,
            WorldCup2026Seeder::class,
            BracketSeeder::class,
            AchievementSeeder::class,
            AdminUserSeeder::class,
            DemoUsersSeeder::class,
            TranslateTeamsSeeder::class,
        ]);
    }
}
