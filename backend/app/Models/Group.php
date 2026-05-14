<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    protected $fillable = ['championship_id', 'name'];

    public function championship() { return $this->belongsTo(Championship::class); }
    public function teams() { return $this->hasMany(Team::class); }
    public function matches() { return $this->hasMany(MatchModel::class); }
}
