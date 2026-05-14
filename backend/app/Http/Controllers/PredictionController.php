<?php

namespace App\Http\Controllers;

use App\Models\MatchModel;
use App\Models\Prediction;
use Illuminate\Http\Request;

class PredictionController extends Controller
{
    public function index(Request $r)
    {
        return $r->user()->predictions()->with('match.homeTeam', 'match.awayTeam')->latest()->paginate(50);
    }

    public function upsert(Request $r, MatchModel $match)
    {
        if ($r->user()->is_admin) {
            return response()->json(['message' => 'Administrador não pode palpitar.'], 403);
        }
        if ($match->isLocked()) {
            return response()->json(['message' => 'Palpites encerrados para esta partida.'], 422);
        }

        // Modo grupos: bloqueia palpites em mata-mata
        if ($match->championship->mode === 'groups' && $match->phase !== 'group') {
            return response()->json(['message' => 'Bolão configurado apenas para fase de grupos.'], 422);
        }

        $data = $r->validate([
            'home_score' => 'required|integer|min:0|max:20',
            'away_score' => 'required|integer|min:0|max:20',
        ]);

        $pred = Prediction::updateOrCreate(
            ['user_id' => $r->user()->id, 'match_id' => $match->id],
            $data,
        );

        return response()->json($pred, 201);
    }

    public function destroy(Request $r, MatchModel $match)
    {
        if ($match->isLocked()) {
            return response()->json(['message' => 'Palpites encerrados para esta partida.'], 422);
        }
        Prediction::where('user_id', $r->user()->id)->where('match_id', $match->id)->delete();
        return response()->noContent();
    }
}
