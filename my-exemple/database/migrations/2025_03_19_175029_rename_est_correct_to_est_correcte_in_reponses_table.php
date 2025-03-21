<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RenameEstCorrectToEstCorrecteInReponsesTable extends Migration
{
    public function up()
    {
        Schema::table('reponses', function (Blueprint $table) {
            $table->renameColumn('est_correct', 'est_correcte');
        });
    }

    public function down()
    {
        Schema::table('reponses', function (Blueprint $table) {
            $table->renameColumn('est_correcte', 'est_correct');
        });
    }
}