<?php

namespace App\Http\Controllers;

use App\Models\Championship;
use App\Models\League;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class RankingController extends Controller
{
    public function global()
    {
        $champ = Championship::where('active', true)->firstOrFail();

        return Cache::remember("ranking:champ:{$champ->id}", 30, function () use ($champ) {
            return DB::table('users')
                ->leftJoin('predictions', 'predictions.user_id', '=', 'users.id')
                ->leftJoin('matches', 'matches.id', '=', 'predictions.match_id')
                ->where(function ($q) use ($champ) {
                    $q->whereNull('matches.id')->orWhere('matches.championship_id', $champ->id);
                })
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
        });
    }

    public function league(League $league)
    {
        return DB::table('league_user')
            ->join('users', 'users.id', '=', 'league_user.user_id')
            ->leftJoin('predictions', 'predictions.user_id', '=', 'users.id')
            ->leftJoin('matches', function ($j) use ($league) {
                $j->on('matches.id', '=', 'predictions.match_id')
                  ->where('matches.championship_id', $league->championship_id);
            })
            ->where('league_user.league_id', $league->id)
            ->groupBy('users.id', 'users.name', 'users.avatar', 'users.level')
            ->select(
                'users.id', 'users.name', 'users.avatar', 'users.level',
                DB::raw('COALESCE(SUM(predictions.points),0) as points'),
            )
            ->orderByDesc('points')
            ->get();
    }
}
