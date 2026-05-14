<?php

namespace App\Services;

use App\Models\Championship;
use App\Models\MatchModel;

class PhaseAdvancementService
{
    public function __construct(private StandingsService $standings) {}

    /**
     * Após todos os jogos da fase de grupos terminarem, resolve placeholders
     * (ex.: "1A", "2C", "3-bestX") nas partidas mata-mata.
     *
     * Formato Copa 2026: top 2 de cada grupo (24 times) + 8 melhores 3ºs → Round of 32.
     */
    public function resolveBracket(Championship $championship): void
    {
        if ($championship->matches()->where('phase', 'group')->where('status', '!=', 'finished')->exists()) {
            return;
        }

        $first = []; $second = []; $thirds = [];

        foreach ($championship->groups()->orderBy('name')->get() as $group) {
            $sorted = $this->standings->forGroup($group);
            $first[$group->name]  = $sorted[0]['team'] ?? null;
            $second[$group->name] = $sorted[1]['team'] ?? null;
            if (isset($sorted[2])) $thirds[$group->name] = $sorted[2];
        }

        // Selecionar 8 melhores terceiros
        $bestThirds = collect($thirds)
            ->sortByDesc(fn ($r) => [$r['P'], $r['SG'], $r['GP'], -$r['fair_play']])
            ->take(8)
            ->map(fn ($r, $groupName) => ['group' => $groupName, 'team' => $r['team']])
            ->values();

        foreach ($championship->matches()->whereIn('phase', ['round_of_32', 'round_of_16', 'quarter', 'semi', 'third_place', 'final'])->get() as $m) {
            $home = $this->resolvePlaceholder($m->home_placeholder, $first, $second, $bestThirds, $championship);
            $away = $this->resolvePlaceholder($m->away_placeholder, $first, $second, $bestThirds, $championship);
            $m->update([
                'home_team_id' => $home?->id,
                'away_team_id' => $away?->id,
            ]);
        }
    }

    private function resolvePlaceholder(?string $ph, array $first, array $second, $bestThirds, Championship $champ)
    {
        if (!$ph) return null;
        if (preg_match('/^1([A-L])$/', $ph, $m)) return $first[$m[1]] ?? null;
        if (preg_match('/^2([A-L])$/', $ph, $m)) return $second[$m[1]] ?? null;
        if (preg_match('/^3BEST(\d)$/', $ph, $m)) {
            $idx = (int) $m[1] - 1;
            return $bestThirds[$idx]['team'] ?? null;
        }
        // Vencedor de partida: W{matchId}
        if (preg_match('/^W(\d+)$/', $ph, $m)) {
            $src = MatchModel::find((int) $m[1]);
            if (!$src || $src->status !== 'finished') return null;
            $winId = $src->winnerTeamId();
            return $winId ? \App\Models\Team::find($winId) : null;
        }
        if (preg_match('/^L(\d+)$/', $ph, $m)) {
            $src = MatchModel::find((int) $m[1]);
            if (!$src || $src->status !== 'finished') return null;
            $winId = $src->winnerTeamId();
            if (!$winId) return null;
            $loserId = $src->home_team_id === $winId ? $src->away_team_id : $src->home_team_id;
            return \App\Models\Team::find($loserId);
        }
        return null;
    }
}
