<?php

use App\Http\Controllers\Admin\AdminChampionshipController;
use App\Http\Controllers\Admin\AdminMatchController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LeagueController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\PredictionController;
use App\Http\Controllers\RankingController;
use App\Http\Controllers\StandingsController;
use Illuminate\Support\Facades\Route;

Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('auth/login',    [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::get('matches',         [MatchController::class, 'index']);
Route::get('matches/{match}', [MatchController::class, 'show']);
Route::get('standings',       [StandingsController::class, 'index']);
Route::get('ranking',         [RankingController::class, 'global'])->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('auth/me',    [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::get('predictions',                       [PredictionController::class, 'index']);
    Route::put('matches/{match}/prediction',        [PredictionController::class, 'upsert']);
    Route::delete('matches/{match}/prediction',     [PredictionController::class, 'destroy']);

    Route::get('leagues',                 [LeagueController::class, 'index']);
    Route::post('leagues',                [LeagueController::class, 'store']);
    Route::get('leagues/{league}',        [LeagueController::class, 'show']);
    Route::put('leagues/{league}',        [LeagueController::class, 'update']);
    Route::post('leagues/join',           [LeagueController::class, 'join']);
    Route::delete('leagues/{league}/leave', [LeagueController::class, 'leave']);
    Route::put('leagues/{league}/members/{user}/payment', [LeagueController::class, 'setMemberPayment']);
    Route::get('leagues/{league}/ranking', [RankingController::class, 'league']);

    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::put('matches/{match}/result',          [AdminMatchController::class, 'updateResult']);
        Route::put('championships/{championship}',    [AdminChampionshipController::class, 'update']);
        Route::get('users',                            [AdminUserController::class, 'index']);
        Route::post('users',                           [AdminUserController::class, 'store']);
        Route::put('users/{user}',                     [AdminUserController::class, 'update']);
        Route::delete('users/{user}',                  [AdminUserController::class, 'destroy']);
    });
});
