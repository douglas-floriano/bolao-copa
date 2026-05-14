<?php

namespace App\Events;

use App\Models\MatchModel;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MatchUpdated implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(public MatchModel $match) {}

    public function broadcastOn(): array
    {
        return [new Channel("championship.{$this->match->championship_id}")];
    }

    public function broadcastAs(): string { return 'match.updated'; }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->match->id,
            'home_score' => $this->match->home_score,
            'away_score' => $this->match->away_score,
            'status' => $this->match->status,
        ];
    }
}
