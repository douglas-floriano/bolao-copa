<?php

namespace App\Http\Controllers\Admin;

use App\Events\MatchUpdated;
use App\Http\Controllers\Controller;
use App\Models\MatchModel;
use App\Services\PhaseAdvancementService;
use App\Services\ScoringService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminMatchController extends Controller
{
    public function updateResult(
        Request $r,
        MatchModel $match,
        ScoringService $scoring,
        PhaseAdvancementService $advance,
    ) {
        $data = $r->validate([
            'home_score' => 'required|integer|min:0|max:30',
            'away_score' => 'required|integer|min:0|max:30',
            'home_score_pen' => 'nullable|integer|min:0|max:30',
            'away_score_pen' => 'nullable|integer|min:0|max:30',
            'status' => 'required|in:scheduled,live,finished',
        ]);

        DB::transaction(function () use ($match, $data, $scoring, $advance) {
            $match->update($data);
            broadcast(new MatchUpdated($match));
            if ($match->status === 'finished') {
                $scoring->recalculateMatch($match);
                $advance->resolveBracket($match->championship);
            }
        });

        audit('match.result', $match, $data);

        return response()->json($match->fresh(['homeTeam', 'awayTeam']));
    }
}
