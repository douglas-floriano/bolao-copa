<?php

namespace App\Services;

use App\Models\Group;
use App\Models\MatchModel;
use App\Models\Team;
use Illuminate\Support\Collection;

class StandingsService
{
    public function forGroup(Group $group): Collection
    {
        $teams = $group->teams;
        $matches = $group->matches()->where('status', 'finished')->get();

        $rows = $teams->map(fn (Team $t) => $this->emptyRow($t));

        foreach ($matches as $m) {
            $this->apply($rows, $m);
        }

        return $this->sortFifa($rows, $matches);
    }

    private function emptyRow(Team $t): array
    {
        return [
            'team' => $t,
            'P' => 0, 'J' => 0, 'V' => 0, 'E' => 0, 'D' => 0,
            'GP' => 0, 'GC' => 0, 'SG' => 0, 'fair_play' => $t->fair_play_points,
        ];
    }

    private function apply(Collection $rows, MatchModel $m): void
    {
        $home = $rows->firstWhere('team.id', $m->home_team_id);
        $away = $rows->firstWhere('team.id', $m->away_team_id);
        if (!$home || !$away) return;

        $hi = $rows->search(fn ($r) => $r['team']->id === $home['team']->id);
        $ai = $rows->search(fn ($r) => $r['team']->id === $away['team']->id);

        $rows[$hi]['J']++; $rows[$ai]['J']++;
        $rows[$hi]['GP'] += $m->home_score; $rows[$hi]['GC'] += $m->away_score;
        $rows[$ai]['GP'] += $m->away_score; $rows[$ai]['GC'] += $m->home_score;

        if ($m->home_score > $m->away_score) {
            $rows[$hi]['V']++; $rows[$hi]['P'] += 3; $rows[$ai]['D']++;
        } elseif ($m->home_score < $m->away_score) {
            $rows[$ai]['V']++; $rows[$ai]['P'] += 3; $rows[$hi]['D']++;
        } else {
            $rows[$hi]['E']++; $rows[$ai]['E']++; $rows[$hi]['P']++; $rows[$ai]['P']++;
        }
        $rows[$hi]['SG'] = $rows[$hi]['GP'] - $rows[$hi]['GC'];
        $rows[$ai]['SG'] = $rows[$ai]['GP'] - $rows[$ai]['GC'];
    }

    /**
     * Critérios FIFA 2026:
     * 1) Pontos confronto direto
     * 2) Saldo confronto direto
     * 3) Gols confronto direto
     * 4) Saldo geral
     * 5) Gols geral
     * 6) Fair play
     * 7) Ranking FIFA
     */
    private function sortFifa(Collection $rows, Collection $matches): Collection
    {
        return $rows->sort(function ($a, $b) use ($matches) {
            if ($a['P'] !== $b['P']) return $b['P'] <=> $a['P'];

            $h2h = $this->headToHead([$a['team']->id, $b['team']->id], $matches);
            if ($h2h['points'][$a['team']->id] !== $h2h['points'][$b['team']->id]) {
                return $h2h['points'][$b['team']->id] <=> $h2h['points'][$a['team']->id];
            }
            if ($h2h['diff'][$a['team']->id] !== $h2h['diff'][$b['team']->id]) {
                return $h2h['diff'][$b['team']->id] <=> $h2h['diff'][$a['team']->id];
            }
            if ($h2h['gf'][$a['team']->id] !== $h2h['gf'][$b['team']->id]) {
                return $h2h['gf'][$b['team']->id] <=> $h2h['gf'][$a['team']->id];
            }
            if ($a['SG'] !== $b['SG']) return $b['SG'] <=> $a['SG'];
            if ($a['GP'] !== $b['GP']) return $b['GP'] <=> $a['GP'];
            if ($a['fair_play'] !== $b['fair_play']) return $a['fair_play'] <=> $b['fair_play'];
            return ($a['team']->fifa_rank ?? 999) <=> ($b['team']->fifa_rank ?? 999);
        })->values();
    }

    private function headToHead(array $ids, Collection $matches): array
    {
        $points = array_fill_keys($ids, 0);
        $diff = array_fill_keys($ids, 0);
        $gf = array_fill_keys($ids, 0);

        foreach ($matches as $m) {
            if (!in_array($m->home_team_id, $ids) || !in_array($m->away_team_id, $ids)) continue;
            $gf[$m->home_team_id] += $m->home_score;
            $gf[$m->away_team_id] += $m->away_score;
            $diff[$m->home_team_id] += ($m->home_score - $m->away_score);
            $diff[$m->away_team_id] += ($m->away_score - $m->home_score);
            if ($m->home_score > $m->away_score) $points[$m->home_team_id] += 3;
            elseif ($m->home_score < $m->away_score) $points[$m->away_team_id] += 3;
            else { $points[$m->home_team_id]++; $points[$m->away_team_id]++; }
        }
        return compact('points', 'diff', 'gf');
    }
}
