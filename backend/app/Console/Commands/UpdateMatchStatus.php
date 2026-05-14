<?php

namespace App\Console\Commands;

use App\Models\MatchModel;
use Carbon\Carbon;
use Illuminate\Console\Command;

class UpdateMatchStatus extends Command
{
    protected $signature = 'matches:update-status';
    protected $description = 'Atualiza status de partidas (scheduled → live → finished pending admin).';

    public function handle(): int
    {
        $now = Carbon::now();
        MatchModel::where('status', 'scheduled')
            ->where('kickoff_at', '<=', $now)
            ->update(['status' => 'live']);

        // Encerramento automático opcional após 2h (admin ainda lança o placar oficial)
        MatchModel::where('status', 'live')
            ->where('kickoff_at', '<=', $now->copy()->subHours(2))
            ->whereNotNull('home_score')
            ->whereNotNull('away_score')
            ->update(['status' => 'finished']);

        return self::SUCCESS;
    }
}
