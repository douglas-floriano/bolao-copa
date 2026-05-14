<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    protected $fillable = ['group_id', 'name', 'code', 'flag', 'fifa_rank', 'fair_play_points'];

    public function group() { return $this->belongsTo(Group::class); }
    public function homeMatches() { return $this->hasMany(MatchModel::class, 'home_team_id'); }
    public function awayMatches() { return $this->hasMany(MatchModel::class, 'away_team_id'); }
}
