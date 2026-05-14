<?php

namespace App\Http\Controllers;

use App\Models\Championship;
use App\Models\League;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class RankingController extends Controller
{
    public function global()
    {
        $champ = Championship::where('active', true)->firstOrFail();

        return DB::table('users')
            ->leftJoin('predictions', 'predictions.user_id', '=', 'users.id')
            ->leftJoin('matches', 'matches.id', '=', 'predictions.match_id')
            ->where(function ($q) use ($champ) {
                $q->whereNull('matches.id')->orWhere('matches.championship_id', $champ->id);
            })
            ->where('users.is_admin', false)
            ->groupBy('users.id', 'users.name', 'users.avatar', 'users.level')
            ->select(
                'users.id', 'users.name', 'users.avatar', 'users.level',
                DB::raw('COALESCE(SUM(predictions.points),0) as points'),
                DB::raw('COALESCE(SUM(CASE WHEN predictions.exact THEN 1 ELSE 0 END),0) as exact_count'),
                DB::raw('COALESCE(SUM(CASE WHEN predictions.winner THEN 1 ELSE 0 END),0) as winner_count'),
            )
            ->orderByDesc('points')
            ->orderByDesc('exact_count')
            ->limit(200)
            ->get();
    }

    public function league(League $league)
    {
        $rows = DB::table('league_user')
            ->join('users', 'users.id', '=', 'league_user.user_id')
            ->leftJoin('predictions', 'predictions.user_id', '=', 'users.id')
            ->leftJoin('matches', function ($j) use ($league) {
                $j->on('matches.id', '=', 'predictions.match_id')
                  ->where('matches.championship_id', $league->championship_id);
            })
            ->where('league_user.league_id', $league->id)
            ->groupBy('users.id', 'users.name', 'users.avatar', 'users.level', 'league_user.entry_paid', 'league_user.paid')
            ->select(
                'users.id', 'users.name', 'users.avatar', 'users.level',
                'league_user.entry_paid', 'league_user.paid',
                DB::raw('COALESCE(SUM(predictions.points),0) as points'),
            )
            ->orderByDesc('points')
            ->get();

        $pool = (float) $league->members()->sum('entry_paid');
        $prizes = collect($league->prize_distribution ?? [])->keyBy('position');

        return $rows->values()->map(function ($r, $idx) use ($pool, $prizes) {
            $pos = $idx + 1;
            $pct = $prizes[$pos]['percent'] ?? 0;
            return [
                ...(array) $r,
                'position' => $pos,
                'prize_percent' => $pct,
                'prize_amount' => round($pool * ($pct / 100), 2),
            ];
        });
    }
}
