<?php

namespace App\Http\Controllers;

use App\Models\Championship;
use App\Models\MatchModel;
use Illuminate\Http\Request;

class MatchController extends Controller
{
    public function index(Request $r)
    {
        $champ = Championship::where('active', true)->firstOrFail();
        return MatchModel::with(['homeTeam', 'awayTeam', 'group'])
            ->where('championship_id', $champ->id)
            ->when($r->phase, fn ($q) => $q->where('phase', $r->phase))
            ->when($r->status, fn ($q) => $q->where('status', $r->status))
            ->orderBy('kickoff_at')
            ->paginate(40);
    }

    public function show(MatchModel $match)
    {
        return $match->load(['homeTeam', 'awayTeam', 'group', 'predictions.user']);
    }
}
