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

        $userId = null;
        if ($bearer = $r->bearerToken()) {
            $token = \Laravel\Sanctum\PersonalAccessToken::findToken($bearer);
            $userId = $token?->tokenable_id;
        }

        return MatchModel::with(['homeTeam', 'awayTeam', 'group'])
            ->withCount('predictions')
            ->when($userId, fn ($q) => $q->with(['predictions' => fn ($p) => $p->where('user_id', $userId)]))
            ->where('championship_id', $champ->id)
            ->when($r->phase, fn ($q) => $q->where('phase', $r->phase))
            ->when($r->status, fn ($q) => $q->where('status', $r->status))
            ->orderBy('kickoff_at')
            ->paginate(min((int) $r->input('per_page', 100), 200));
    }

    public function show(MatchModel $match)
    {
        return $match->load(['homeTeam', 'awayTeam', 'group', 'predictions.user']);
    }
}
