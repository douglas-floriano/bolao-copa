<?php

namespace Database\Seeders;

use App\Models\Championship;
use App\Models\Group;
use App\Models\MatchModel;
use App\Models\Team;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Copa do Mundo FIFA 2026 — Grupos oficiais do sorteio (05/12/2025, Kennedy Center).
 * 48 seleções, 12 grupos de 4. 72 jogos na fase de grupos.
 * Datas de início aproximadas (11/06/2026 → 27/06/2026). Admin pode ajustar via painel.
 */
class WorldCup2026Seeder extends Seeder
{
    private const GROUPS = [
        'A' => [['Mexico','MEX'],['South Africa','RSA'],['South Korea','KOR'],['Czech Republic','CZE']],
        'B' => [['Canada','CAN'],['Bosnia and Herzegovina','BIH'],['Qatar','QAT'],['Switzerland','SUI']],
        'C' => [['Brazil','BRA'],['Morocco','MAR'],['Haiti','HAI'],['Scotland','SCO']],
        'D' => [['United States','USA'],['Paraguay','PAR'],['Australia','AUS'],['Turkey','TUR']],
        'E' => [['Germany','GER'],['Curacao','CUW'],['Ivory Coast','CIV'],['Ecuador','ECU']],
        'F' => [['Netherlands','NED'],['Japan','JPN'],['Sweden','SWE'],['Tunisia','TUN']],
        'G' => [['Belgium','BEL'],['Egypt','EGY'],['Iran','IRN'],['New Zealand','NZL']],
        'H' => [['Spain','ESP'],['Cape Verde','CPV'],['Saudi Arabia','KSA'],['Uruguay','URU']],
        'I' => [['France','FRA'],['Senegal','SEN'],['Iraq','IRQ'],['Norway','NOR']],
        'J' => [['Argentina','ARG'],['Algeria','ALG'],['Austria','AUT'],['Jordan','JOR']],
        'K' => [['Portugal','POR'],['DR Congo','COD'],['Uzbekistan','UZB'],['Colombia','COL']],
        'L' => [['England','ENG'],['Croatia','CRO'],['Ghana','GHA'],['Panama','PAN']],
    ];

    private const STADIUMS = [
        'MetLife Stadium, East Rutherford',
        'AT&T Stadium, Arlington',
        'SoFi Stadium, Inglewood',
        'Mercedes-Benz Stadium, Atlanta',
        'Estadio Azteca, Mexico City',
        'BC Place, Vancouver',
        'BMO Field, Toronto',
        'NRG Stadium, Houston',
        'Lincoln Financial Field, Philadelphia',
        'Lumen Field, Seattle',
        'Levi\'s Stadium, Santa Clara',
        'Gillette Stadium, Foxborough',
        'Hard Rock Stadium, Miami',
        'GEHA Field at Arrowhead, Kansas City',
        'Estadio BBVA, Monterrey',
        'Estadio Akron, Guadalajara',
    ];

    public function run(): void
    {
        $champ = Championship::where('slug', 'copa-2026')->firstOrFail();

        // 1. Grupos + seleções
        $teamsByGroup = [];
        foreach (self::GROUPS as $name => $teams) {
            $g = Group::firstOrCreate(['championship_id' => $champ->id, 'name' => $name]);
            foreach ($teams as $i => [$tname, $code]) {
                $teamsByGroup[$name][$i] = Team::updateOrCreate(
                    ['code' => $code],
                    [
                        'group_id' => $g->id,
                        'name' => $tname,
                        'flag' => "https://flagcdn.com/w160/" . strtolower(self::iso2($code)) . ".png",
                    ]
                );
            }
        }

        // 2. Partidas da fase de grupos — round-robin (6 por grupo = 72 no total)
        $start = Carbon::parse('2026-06-11 13:00:00', 'America/Sao_Paulo');
        $matchIndex = 0;

        foreach (self::GROUPS as $gName => $_) {
            $g = Group::where('championship_id', $champ->id)->where('name', $gName)->first();
            $t = $teamsByGroup[$gName];
            $pairs = [
                [0,1],[2,3],   // rodada 1
                [0,2],[1,3],   // rodada 2
                [0,3],[1,2],   // rodada 3
            ];
            foreach ($pairs as $r => $pair) {
                MatchModel::updateOrCreate(
                    [
                        'championship_id' => $champ->id,
                        'group_id' => $g->id,
                        'home_team_id' => $t[$pair[0]]->id,
                        'away_team_id' => $t[$pair[1]]->id,
                    ],
                    [
                        'phase' => 'group',
                        'round' => intdiv($r, 2) + 1,
                        'kickoff_at' => $start->copy()->addHours($matchIndex * 3),
                        'stadium' => self::STADIUMS[$matchIndex % count(self::STADIUMS)],
                        'status' => 'scheduled',
                    ]
                );
                $matchIndex++;
            }
        }
    }

    private static function iso2(string $iso3): string
    {
        return match ($iso3) {
            'MEX'=>'MX','RSA'=>'ZA','KOR'=>'KR','CZE'=>'CZ','CAN'=>'CA','BIH'=>'BA','QAT'=>'QA','SUI'=>'CH',
            'BRA'=>'BR','MAR'=>'MA','HAI'=>'HT','SCO'=>'GB-SCT','USA'=>'US','PAR'=>'PY','AUS'=>'AU','TUR'=>'TR',
            'GER'=>'DE','CUW'=>'CW','CIV'=>'CI','ECU'=>'EC','NED'=>'NL','JPN'=>'JP','SWE'=>'SE','TUN'=>'TN',
            'BEL'=>'BE','EGY'=>'EG','IRN'=>'IR','NZL'=>'NZ','ESP'=>'ES','CPV'=>'CV','KSA'=>'SA','URU'=>'UY',
            'FRA'=>'FR','SEN'=>'SN','IRQ'=>'IQ','NOR'=>'NO','ARG'=>'AR','ALG'=>'DZ','AUT'=>'AT','JOR'=>'JO',
            'POR'=>'PT','COD'=>'CD','UZB'=>'UZ','COL'=>'CO','ENG'=>'GB-ENG','CRO'=>'HR','GHA'=>'GH','PAN'=>'PA',
            default => 'un',
        };
    }
}
