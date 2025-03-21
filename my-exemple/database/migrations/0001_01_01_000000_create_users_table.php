<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Table: users
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('role', ['admin', 'formateur', 'apprenant'])->default('apprenant');
            $table->timestamps();
        });

        // Table: formations
        Schema::create('formations', function (Blueprint $table) {
            $table->id();
            $table->string('titre');
            $table->text('description');
            $table->string('image')->nullable();
            $table->foreignId('formateur_id')->constrained('users')->onDelete('cascade');
            $table->enum('categorie', ['Développement', 'Design', 'Marketing', 'Business'])->default('Développement');
            $table->decimal('prix', 10, 2)->default(0.00);
            $table->integer('duree')->comment('Durée en heures');
            $table->boolean('quiz_demarre')->default(false);
            $table->integer('quiz_duration')->nullable()->comment('Durée en secondes');
            $table->dateTime('quiz_end_time')->nullable();
            $table->dateTime('quiz_started_at')->nullable();
            $table->timestamps();
        });

        // Table: inscriptions
        Schema::create('inscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('formation_id')->constrained('formations')->onDelete('cascade');
            $table->enum('statut', ['en_attente', 'validé', 'terminé'])->default('en_attente');
            $table->boolean('is_paid')->default(false);
            $table->decimal('score', 5, 2)->nullable();
            $table->boolean('has_passed_quiz')->nullable();
            $table->boolean('certified')->default(false);
            $table->timestamps();
            $table->unique(['user_id', 'formation_id']); // Unicité pour éviter les doublons
        });

        // Table: lecons
        Schema::create('lecons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('formation_id')->constrained('formations')->onDelete('cascade');
            $table->string('titre');
            $table->text('contenu');
            $table->integer('ordre')->default(0);
            $table->timestamps();
        });

        // Table: quiz
        Schema::create('quiz', function (Blueprint $table) {
            $table->id();
            $table->foreignId('formation_id')->constrained('formations')->onDelete('cascade');
            $table->string('titre');
            $table->integer('ordre')->default(0);
            $table->timestamps();
        });

        // Table: questions
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained('quiz')->onDelete('cascade');
            $table->text('question');
            $table->enum('type', ['choix_multiple', 'vrai_faux', 'texte'])->default('choix_multiple');
            $table->timestamps();
        });

        // Table: reponses
        Schema::create('reponses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            $table->text('reponse');
            $table->boolean('est_correct')->default(false);
            $table->timestamps();
        });

        // Table: quiz_attempts (ajoutée pour suivre les tentatives des utilisateurs)
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('formation_id')->constrained('formations')->onDelete('cascade');
            $table->foreignId('quiz_id')->nullable()->constrained('quiz')->onDelete('set null');
            $table->boolean('is_active')->default(true);
            $table->dateTime('started_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->decimal('score', 5, 2)->nullable();
            $table->timestamps();
        });

        // Table: paiements
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('formation_id')->constrained('formations')->onDelete('cascade');
            $table->decimal('montant', 10, 2);
            $table->enum('statut', ['en_attente', 'effectué', 'échoué'])->default('en_attente');
            $table->enum('methode', ['carte', 'paypal', 'virement'])->default('carte');
            $table->string('transaction_id')->unique();
            $table->timestamps();
        });

        // Table: certificats
        Schema::create('certificats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('formation_id')->constrained('formations')->onDelete('cascade');
            $table->dateTime('date_obtention')->useCurrent();
            $table->timestamps();
            $table->unique(['user_id', 'formation_id']); // Unicité pour éviter les doublons
        });

        // Table: sessions (pour Sanctum ou gestion de sessions)
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index()->constrained('users')->onDelete('cascade');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('certificats');
        Schema::dropIfExists('paiements');
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('reponses');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('quiz');
        Schema::dropIfExists('lecons');
        Schema::dropIfExists('inscriptions'); // Corrigé "inscription" -> "inscriptions"
        Schema::dropIfExists('formations');
        Schema::dropIfExists('users');
    }
};