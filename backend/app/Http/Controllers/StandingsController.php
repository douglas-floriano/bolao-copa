<?php

namespace App\Http\Controllers;

use App\Models\Championship;
use App\Services\StandingsService;

class StandingsController extends Controller
{
    public function index(StandingsService $svc)
    {
        $champ = Championship::where('active', true)->firstOrFail();

        return $champ->groups()->orderBy('name')->get()->map(function ($g) use ($svc) {
            return [
                'group' => $g->name,
                'rows' => $svc->forGroup($g)->map(fn ($r) => [
                    'team' => [
                        'id' => $r['team']->id,
                        'name' => $r['team']->name,
                        'code' => $r['team']->code,
                        'flag' => $r['team']->flag,
                    ],
                    'P' => $r['P'], 'J' => $r['J'], 'V' => $r['V'], 'E' => $r['E'], 'D' => $r['D'],
                    'GP' => $r['GP'], 'GC' => $r['GC'], 'SG' => $r['SG'],
                ]),
            ];
        });
    }
}
