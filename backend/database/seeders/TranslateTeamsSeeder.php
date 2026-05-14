<?php

namespace Database\Seeders;

use App\Models\Team;
use Illuminate\Database\Seeder;

class TranslateTeamsSeeder extends Seeder
{
    private const PT = [
        'MEX' => 'México',           'RSA' => 'África do Sul',     'KOR' => 'Coreia do Sul',     'CZE' => 'República Tcheca',
        'CAN' => 'Canadá',           'BIH' => 'Bósnia e Herzegovina', 'QAT' => 'Catar',          'SUI' => 'Suíça',
        'BRA' => 'Brasil',           'MAR' => 'Marrocos',          'HAI' => 'Haiti',             'SCO' => 'Escócia',
        'USA' => 'Estados Unidos',   'PAR' => 'Paraguai',          'AUS' => 'Austrália',         'TUR' => 'Turquia',
        'GER' => 'Alemanha',         'CUW' => 'Curaçao',           'CIV' => 'Costa do Marfim',   'ECU' => 'Equador',
        'NED' => 'Holanda',          'JPN' => 'Japão',             'SWE' => 'Suécia',            'TUN' => 'Tunísia',
        'BEL' => 'Bélgica',          'EGY' => 'Egito',             'IRN' => 'Irã',               'NZL' => 'Nova Zelândia',
        'ESP' => 'Espanha',          'CPV' => 'Cabo Verde',        'KSA' => 'Arábia Saudita',    'URU' => 'Uruguai',
        'FRA' => 'França',           'SEN' => 'Senegal',           'IRQ' => 'Iraque',            'NOR' => 'Noruega',
        'ARG' => 'Argentina',        'ALG' => 'Argélia',           'AUT' => 'Áustria',           'JOR' => 'Jordânia',
        'POR' => 'Portugal',         'COD' => 'República Democrática do Congo', 'UZB' => 'Uzbequistão', 'COL' => 'Colômbia',
        'ENG' => 'Inglaterra',       'CRO' => 'Croácia',           'GHA' => 'Gana',              'PAN' => 'Panamá',
    ];

    public function run(): void
    {
        foreach (self::PT as $code => $name) {
            Team::where('code', $code)->update(['name' => $name]);
        }
    }
}
