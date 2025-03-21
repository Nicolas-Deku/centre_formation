<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddStartedAtAndDurationToQuizTable extends Migration
{
    public function up()
    {
        Schema::table('quiz', function (Blueprint $table) {
            $table->timestamp('started_at')->nullable()->after('ordre');
            $table->integer('duration')->nullable()->after('started_at'); // Durée en minutes
        });
    }

    public function down()
    {
        Schema::table('quiz', function (Blueprint $table) {
            $table->dropColumn(['started_at', 'duration']);
        });
    }
}