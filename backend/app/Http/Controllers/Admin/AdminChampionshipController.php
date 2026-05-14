<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Championship;
use App\Services\ScoringService;
use Illuminate\Http\Request;

class AdminChampionshipController extends Controller
{
    public function update(Request $r, Championship $championship, ScoringService $scoring)
    {
        $data = $r->validate([
            'mode' => 'in:groups,full',
            'points_exact' => 'integer|min:0|max:50',
            'points_winner' => 'integer|min:0|max:50',
            'lock_minutes' => 'integer|min:0|max:1440',
            'active' => 'boolean',
        ]);
        $championship->update($data);
        if (array_intersect_key($data, array_flip(['points_exact', 'points_winner']))) {
            $scoring->recalculateChampionship($championship);
        }
        audit('championship.update', $championship, $data);
        return $championship->fresh();
    }
}
