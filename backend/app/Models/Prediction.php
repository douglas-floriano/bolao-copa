<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prediction extends Model
{
    protected $fillable = ['user_id', 'match_id', 'home_score', 'away_score', 'points', 'exact', 'winner'];
    protected $casts = ['exact' => 'boolean', 'winner' => 'boolean'];

    public function user() { return $this->belongsTo(User::class); }
    public function match() { return $this->belongsTo(MatchModel::class, 'match_id'); }
}
