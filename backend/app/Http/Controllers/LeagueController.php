<?php

namespace App\Http\Controllers;

use App\Models\Championship;
use App\Models\League;
use Illuminate\Http\Request;

class LeagueController extends Controller
{
    public function index(Request $r)
    {
        return $r->user()->leagues()->with('owner')->get();
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'name' => 'required|string|max:80',
            'description' => 'nullable|string|max:255',
            'is_public' => 'boolean',
        ]);
        $champ = Championship::where('active', true)->firstOrFail();
        $league = League::create([
            ...$data,
            'championship_id' => $champ->id,
            'owner_id' => $r->user()->id,
        ]);
        $league->members()->attach($r->user()->id);
        return response()->json($league, 201);
    }

    public function join(Request $r)
    {
        $r->validate(['invite_code' => 'required|string']);
        $league = League::where('invite_code', strtoupper($r->invite_code))->firstOrFail();
        $league->members()->syncWithoutDetaching([$r->user()->id]);
        return response()->json($league);
    }
}
