<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class League extends Model
{
    protected $fillable = ['championship_id', 'owner_id', 'name', 'invite_code', 'description', 'is_public'];
    protected $casts = ['is_public' => 'boolean'];

    protected static function booted(): void
    {
        static::creating(function (League $l) {
            $l->invite_code ??= strtoupper(Str::random(10));
        });
    }

    public function owner() { return $this->belongsTo(User::class, 'owner_id'); }
    public function championship() { return $this->belongsTo(Championship::class); }
    public function members() { return $this->belongsToMany(User::class)->withTimestamps(); }
}
