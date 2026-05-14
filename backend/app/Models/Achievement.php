<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Achievement extends Model
{
    protected $fillable = ['code', 'name', 'description', 'icon', 'xp_reward'];

    public function users() { return $this->belongsToMany(User::class)->withPivot('unlocked_at'); }
}
