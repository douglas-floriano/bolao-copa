<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Championship extends Model
{
    protected $fillable = [
        'name', 'slug', 'mode', 'points_exact', 'points_winner',
        'lock_minutes', 'active', 'start_date', 'end_date',
    ];

    protected $casts = [
        'active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function groups() { return $this->hasMany(Group::class); }
    public function matches() { return $this->hasMany(MatchModel::class); }
    public function leagues() { return $this->hasMany(League::class); }
}
