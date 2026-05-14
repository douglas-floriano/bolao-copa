<?php

namespace Database\Seeders;

use App\Models\Achievement;
use Illuminate\Database\Seeder;

class AchievementSeeder extends Seeder
{
    public function run(): void
    {
        $list = [
            ['first_blood',        'Primeiro Acerto',           'Primeira pontuação no bolão.',                     'star',       30],
            ['hat_trick',          'Hat-Trick',                 '3 placares exatos seguidos.',                       'trophy',    150],
            ['group_master',       'Mestre da Fase de Grupos',  'Mais de 60% de aproveitamento na fase de grupos.',  'medal',     200],
            ['round_of_16_king',   'Rei das Oitavas',           '5 acertos nas oitavas.',                            'crown',     250],
            ['quarter_master',     'Senhor das Quartas',        '3 acertos nas quartas.',                            'shield',    300],
            ['semi_oracle',        'Oráculo das Semis',         '2 acertos nas semifinais.',                         'eye',       400],
            ['final_prophet',      'Profeta da Final',          'Acertou o placar exato da Final.',                  'fire',     1000],
            ['top_10',             'Top 10 Global',             'Entre os 10 melhores do ranking geral.',            'gem',       500],
            ['leader',             'Líder',                     'Já liderou o ranking por pelo menos 1 dia.',        'flag',      300],
        ];
        foreach ($list as [$code, $name, $desc, $icon, $xp]) {
            Achievement::updateOrCreate(
                ['code' => $code],
                ['name' => $name, 'description' => $desc, 'icon' => $icon, 'xp_reward' => $xp],
            );
        }
    }
}
