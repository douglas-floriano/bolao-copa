<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class League extends Model
{
    protected $fillable = [
        'championship_id', 'owner_id', 'name', 'invite_code', 'description', 'is_public',
        'entry_fee', 'prize_distribution', 'currency',
    ];
    protected $casts = [
        'is_public' => 'boolean',
        'entry_fee' => 'decimal:2',
        'prize_distribution' => 'array',
    ];

    public function totalPool(): float
    {
        return (float) $this->members()->sum('entry_paid');
    }

    protected static function booted(): void
    {
        static::creating(function (League $l) {
            $l->invite_code ??= strtoupper(Str::random(10));
        });
    }

    public function owner() { return $this->belongsTo(User::class, 'owner_id'); }
    public function championship() { return $this->belongsTo(Championship::class); }
    public function members() { return $this->belongsToMany(User::class)->withPivot('joined_at', 'entry_paid', 'paid'); }
}
