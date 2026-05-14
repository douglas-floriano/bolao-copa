<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('leagues', function (Blueprint $table) {
            $table->decimal('entry_fee', 10, 2)->default(0)->after('description');
            $table->json('prize_distribution')->nullable()->after('entry_fee');
            $table->string('currency', 3)->default('BRL')->after('prize_distribution');
        });

        Schema::table('league_user', function (Blueprint $table) {
            $table->decimal('entry_paid', 10, 2)->default(0)->after('user_id');
            $table->boolean('paid')->default(false)->after('entry_paid');
        });
    }

    public function down(): void
    {
        Schema::table('league_user', function (Blueprint $table) {
            $table->dropColumn(['entry_paid', 'paid']);
        });
        Schema::table('leagues', function (Blueprint $table) {
            $table->dropColumn(['entry_fee', 'prize_distribution', 'currency']);
        });
    }
};
