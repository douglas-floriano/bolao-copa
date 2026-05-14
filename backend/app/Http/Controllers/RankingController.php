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

        $rows = DB::table('users')
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

        // Calcular prêmio total de cada usuário (somando posição nas ligas que participa)
        $prizeMap = $this->computePrizesPerUser($champ->id);

        return $rows->map(function ($r) use ($prizeMap) {
            $r->total_prize = $prizeMap[$r->id] ?? 0;
            $r->prize_leagues = $prizeMap['_detail'][$r->id] ?? [];
            return $r;
        });
    }

    private function computePrizesPerUser(int $championshipId): array
    {
        $result = ['_detail' => []];
        $leagues = League::where('championship_id', $championshipId)->where('entry_fee', '>', 0)->get();

        foreach ($leagues as $league) {
            $pool = (float) $league->members()->sum('entry_paid');
            if ($pool <= 0) continue;
            $prizes = collect($league->prize_distribution ?? [])->keyBy('position');
            if ($prizes->isEmpty()) continue;

            // Ranking interno da liga
            $ranking = DB::table('league_user')
                ->join('users', 'users.id', '=', 'league_user.user_id')
                ->leftJoin('predictions', 'predictions.user_id', '=', 'users.id')
                ->leftJoin('matches', function ($j) use ($championshipId) {
                    $j->on('matches.id', '=', 'predictions.match_id')
                      ->where('matches.championship_id', $championshipId);
                })
                ->where('league_user.league_id', $league->id)
                ->groupBy('users.id')
                ->select('users.id', DB::raw('COALESCE(SUM(predictions.points),0) as points'))
                ->orderByDesc('points')
                ->get();

            foreach ($ranking as $idx => $u) {
                $pos = $idx + 1;
                if (!isset($prizes[$pos])) continue;
                $amount = round($pool * ($prizes[$pos]['percent'] / 100), 2);
                $result[$u->id] = ($result[$u->id] ?? 0) + $amount;
                $result['_detail'][$u->id][] = [
                    'league' => $league->name,
                    'position' => $pos,
                    'amount' => $amount,
                ];
            }
        }
        return $result;
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
