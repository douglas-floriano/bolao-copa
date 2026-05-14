<?php

namespace App\Services;

use App\Events\RankingUpdated;
use App\Models\Championship;
use App\Models\MatchModel;
use App\Models\Prediction;
use Illuminate\Support\Facades\DB;

class ScoringService
{
    public function recalculateMatch(MatchModel $match): void
    {
        if ($match->status !== 'finished' || $match->home_score === null || $match->away_score === null) {
            return;
        }

        $champ = $match->championship;
        $pointsExact = $champ->points_exact;
        $pointsWinner = $champ->points_winner;

        $realOutcome = $this->outcome($match->home_score, $match->away_score);

        DB::transaction(function () use ($match, $pointsExact, $pointsWinner, $realOutcome) {
            Prediction::where('match_id', $match->id)->chunkById(500, function ($chunk) use ($match, $pointsExact, $pointsWinner, $realOutcome) {
                foreach ($chunk as $p) {
                    $exact = ($p->home_score === $match->home_score && $p->away_score === $match->away_score);
                    $predOutcome = $this->outcome($p->home_score, $p->away_score);
                    $winner = $predOutcome === $realOutcome;
                    $points = $exact ? $pointsExact : ($winner ? $pointsWinner : 0);
                    $p->update(['points' => $points, 'exact' => $exact, 'winner' => $winner]);
                }
            });
        });

        broadcast(new RankingUpdated($match->championship_id))->toOthers();
    }

    public function recalculateChampionship(Championship $championship): void
    {
        $championship->matches()->where('status', 'finished')->get()->each(fn ($m) => $this->recalculateMatch($m));
    }

    private function outcome(int $home, int $away): string
    {
        return $home > $away ? 'H' : ($home < $away ? 'A' : 'D');
    }
}
