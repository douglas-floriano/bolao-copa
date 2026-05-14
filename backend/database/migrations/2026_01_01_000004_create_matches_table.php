<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('championship_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('phase', [
                'group', 'round_of_32', 'round_of_16', 'quarter', 'semi', 'third_place', 'final',
            ]);
            $table->unsignedSmallInteger('round')->nullable();
            $table->foreignId('home_team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->foreignId('away_team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->string('home_placeholder')->nullable(); // ex.: "1A", "2B"
            $table->string('away_placeholder')->nullable();
            $table->unsignedTinyInteger('home_score')->nullable();
            $table->unsignedTinyInteger('away_score')->nullable();
            $table->unsignedTinyInteger('home_score_pen')->nullable();
            $table->unsignedTinyInteger('away_score_pen')->nullable();
            $table->dateTime('kickoff_at');
            $table->string('stadium')->nullable();
            $table->string('city')->nullable();
            $table->enum('status', ['scheduled', 'live', 'finished'])->default('scheduled');
            $table->timestamps();
            $table->index(['championship_id', 'phase']);
            $table->index('kickoff_at');
        });
    }

    public function down(): void { Schema::dropIfExists('matches'); }
};
