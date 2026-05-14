<?php

namespace Database\Seeders;

use App\Models\Championship;
use App\Models\MatchModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Estrutura do mata-mata da Copa 2026 (Round of 32 → Final).
 * Placeholders são resolvidos pelo PhaseAdvancementService quando a fase anterior terminar.
 *
 * Round of 32 (16 jogos) começa 29/06/2026. Datas aproximadas.
 */
class BracketSeeder extends Seeder
{
    public function run(): void
    {
        $champ = Championship::where('slug', 'copa-2026')->firstOrFail();
        $kick = Carbon::parse('2026-06-29 13:00:00', 'America/Sao_Paulo');

        // 16 partidas do Round of 32 (chaveamento simplificado oficial)
        $r32 = [
            ['1A','3BEST1'], ['2C','2D'],
            ['1B','2F'],     ['2A','2B'],
            ['1F','3BEST2'], ['2E','2H'],
            ['1C','3BEST3'], ['2I','2J'],
            ['1E','3BEST4'], ['2G','2K'],
            ['1H','3BEST5'], ['2L','3BEST6'],
            ['1G','3BEST7'], ['1D','3BEST8'],
            ['1I','2L'],     ['1J','1K'],
        ];

        foreach ($r32 as $idx => [$h, $a]) {
            MatchModel::updateOrCreate(
                [
                    'championship_id' => $champ->id,
                    'phase' => 'round_of_32',
                    'home_placeholder' => $h,
                    'away_placeholder' => $a,
                ],
                [
                    'kickoff_at' => $kick->copy()->addHours($idx * 3),
                    'stadium' => 'A definir',
                    'status' => 'scheduled',
                ]
            );
        }

        $r32Matches = MatchModel::where('championship_id', $champ->id)->where('phase', 'round_of_32')->orderBy('id')->get();

        // Round of 16 (8 partidas)
        $kick = Carbon::parse('2026-07-04 13:00:00', 'America/Sao_Paulo');
        $r16Pairs = [];
        for ($i = 0; $i < 16; $i += 2) {
            $r16Pairs[] = ['W' . $r32Matches[$i]->id, 'W' . $r32Matches[$i + 1]->id];
        }
        $r16Created = [];
        foreach ($r16Pairs as $idx => [$h, $a]) {
            $r16Created[] = MatchModel::updateOrCreate(
                ['championship_id' => $champ->id, 'phase' => 'round_of_16', 'home_placeholder' => $h, 'away_placeholder' => $a],
                ['kickoff_at' => $kick->copy()->addHours($idx * 4), 'stadium' => 'A definir', 'status' => 'scheduled']
            );
        }

        // Quartas (4)
        $kick = Carbon::parse('2026-07-09 13:00:00', 'America/Sao_Paulo');
        $qfCreated = [];
        for ($i = 0; $i < 8; $i += 2) {
            $qfCreated[] = MatchModel::updateOrCreate(
                ['championship_id' => $champ->id, 'phase' => 'quarter',
                 'home_placeholder' => 'W' . $r16Created[$i]->id, 'away_placeholder' => 'W' . $r16Created[$i + 1]->id],
                ['kickoff_at' => $kick->copy()->addHours($i * 2), 'stadium' => 'A definir', 'status' => 'scheduled']
            );
        }

        // Semis (2)
        $kick = Carbon::parse('2026-07-14 16:00:00', 'America/Sao_Paulo');
        $sfCreated = [];
        for ($i = 0; $i < 4; $i += 2) {
            $sfCreated[] = MatchModel::updateOrCreate(
                ['championship_id' => $champ->id, 'phase' => 'semi',
                 'home_placeholder' => 'W' . $qfCreated[$i]->id, 'away_placeholder' => 'W' . $qfCreated[$i + 1]->id],
                ['kickoff_at' => $kick->copy()->addDay($i)->setTime(16,0), 'stadium' => 'A definir', 'status' => 'scheduled']
            );
        }

        // Disputa do 3º lugar
        MatchModel::updateOrCreate(
            ['championship_id' => $champ->id, 'phase' => 'third_place',
             'home_placeholder' => 'L' . $sfCreated[0]->id, 'away_placeholder' => 'L' . $sfCreated[1]->id],
            ['kickoff_at' => Carbon::parse('2026-07-18 13:00:00', 'America/Sao_Paulo'), 'stadium' => 'A definir', 'status' => 'scheduled']
        );

        // Final
        MatchModel::updateOrCreate(
            ['championship_id' => $champ->id, 'phase' => 'final',
             'home_placeholder' => 'W' . $sfCreated[0]->id, 'away_placeholder' => 'W' . $sfCreated[1]->id],
            ['kickoff_at' => Carbon::parse('2026-07-19 16:00:00', 'America/Sao_Paulo'), 'stadium' => 'MetLife Stadium, East Rutherford', 'status' => 'scheduled']
        );
    }
}
