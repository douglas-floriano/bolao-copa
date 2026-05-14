<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'avatar', 'is_admin'];
    protected $hidden = ['password', 'remember_token'];
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_admin' => 'boolean',
    ];

    public function predictions() { return $this->hasMany(Prediction::class); }
    public function leagues() { return $this->belongsToMany(League::class)->withTimestamps(); }
    public function achievements() { return $this->belongsToMany(Achievement::class)->withTimestamps(); }

    public function totalPoints(?int $championshipId = null): int
    {
        return (int) $this->predictions()
            ->when($championshipId, fn ($q) => $q->whereHas('match', fn ($m) => $m->where('championship_id', $championshipId)))
            ->sum('points');
    }
}
