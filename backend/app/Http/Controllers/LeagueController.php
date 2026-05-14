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
            'entry_fee' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|size:3',
            'prize_distribution' => 'nullable|array',
            'prize_distribution.*.position' => 'integer|min:1',
            'prize_distribution.*.percent' => 'numeric|min:0|max:100',
        ]);

        // Default 60/30/10 se não informado
        $data['prize_distribution'] ??= [
            ['position' => 1, 'percent' => 60],
            ['position' => 2, 'percent' => 30],
            ['position' => 3, 'percent' => 10],
        ];

        $champ = Championship::where('active', true)->firstOrFail();
        $league = League::create([
            ...$data,
            'championship_id' => $champ->id,
            'owner_id' => $r->user()->id,
        ]);
        $league->members()->attach($r->user()->id, [
            'entry_paid' => $data['entry_fee'] ?? 0,
        ]);
        return response()->json($league, 201);
    }

    public function update(Request $r, League $league)
    {
        abort_unless($league->owner_id === $r->user()->id || $r->user()->is_admin, 403);
        $data = $r->validate([
            'name' => 'sometimes|string|max:80',
            'description' => 'nullable|string|max:255',
            'is_public' => 'sometimes|boolean',
            'entry_fee' => 'sometimes|numeric|min:0',
            'currency' => 'sometimes|string|size:3',
            'prize_distribution' => 'sometimes|array',
            'prize_distribution.*.position' => 'integer|min:1',
            'prize_distribution.*.percent' => 'numeric|min:0|max:100',
        ]);
        $league->update($data);
        return $league;
    }

    public function show(League $league)
    {
        $league->load('members', 'owner');
        return [
            'league' => $league,
            'pool' => $league->totalPool(),
            'prizes' => collect($league->prize_distribution ?? [])->map(fn ($r) => [
                'position' => $r['position'],
                'percent' => $r['percent'],
                'amount' => round($league->totalPool() * ($r['percent'] / 100), 2),
            ])->values(),
        ];
    }

    public function join(Request $r)
    {
        $r->validate(['invite_code' => 'required|string']);
        $league = League::where('invite_code', strtoupper($r->invite_code))->firstOrFail();
        $league->members()->syncWithoutDetaching([
            $r->user()->id => ['entry_paid' => $league->entry_fee ?? 0],
        ]);
        return response()->json($league);
    }

    public function setMemberPayment(Request $r, League $league, \App\Models\User $user)
    {
        abort_unless($league->owner_id === $r->user()->id || $r->user()->is_admin, 403);
        $data = $r->validate([
            'entry_paid' => 'required|numeric|min:0',
            'paid' => 'boolean',
        ]);
        $league->members()->updateExistingPivot($user->id, $data);
        return $league->fresh()->load('members');
    }
}
