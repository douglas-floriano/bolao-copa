<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class MatchModel extends Model
{
    protected $table = 'matches';

    protected $fillable = [
        'championship_id', 'group_id', 'phase', 'round',
        'home_team_id', 'away_team_id', 'home_placeholder', 'away_placeholder',
        'home_score', 'away_score', 'home_score_pen', 'away_score_pen',
        'kickoff_at', 'stadium', 'city', 'status',
    ];

    protected $casts = ['kickoff_at' => 'datetime'];

    public function championship() { return $this->belongsTo(Championship::class); }
    public function group() { return $this->belongsTo(Group::class); }
    public function homeTeam() { return $this->belongsTo(Team::class, 'home_team_id'); }
    public function awayTeam() { return $this->belongsTo(Team::class, 'away_team_id'); }
    public function predictions() { return $this->hasMany(Prediction::class, 'match_id'); }

    public function isLocked(): bool
    {
        $lockMin = $this->championship?->lock_minutes ?? 60;
        return Carbon::now()->gte($this->kickoff_at->copy()->subMinutes($lockMin));
    }

    public function winnerTeamId(): ?int
    {
        if ($this->status !== 'finished') return null;
        if ($this->home_score === $this->away_score) {
            if ($this->home_score_pen !== null && $this->away_score_pen !== null) {
                return $this->home_score_pen > $this->away_score_pen ? $this->home_team_id : $this->away_team_id;
            }
            return null;
        }
        return $this->home_score > $this->away_score ? $this->home_team_id : $this->away_team_id;
    }
}
