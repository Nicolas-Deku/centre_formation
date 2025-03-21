<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FormationController;
use App\Http\Controllers\InscriptionController;
use App\Http\Controllers\LeconController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\ReponseController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\CertificatController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\QuizAttemptController;
use App\Http\Controllers\SessionController;

// Routes publiques (aucune authentification requise)
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::get('/formations', [FormationController::class, 'index'])->name('formations.index');
Route::get('/formations/{formation}', [FormationController::class, 'show'])->name('formations.show');
Route::get('/quiz', [QuizController::class, 'index'])->name('quiz.index');
Route::get('/quiz/{quiz}', [QuizController::class, 'show'])->name('quiz.show');

// Routes protégées par authentification (middleware sanctum)
Route::middleware(['auth:sanctum'])->group(function () {
    // Authentification et utilisateur
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/user', [AuthController::class, 'user'])->name('user');

    // Routes spécifiques pour les formateurs
    Route::get('/formateur/formations', [FormationController::class, 'formateurFormations'])->name('formateur.formations');
    Route::get('/formations/{formation}/apprenants', [FormationController::class, 'getApprenants'])->name('formations.apprenants');
    Route::post('/formations/{formation}/start-quiz', [QuizController::class, 'startQuiz'])->name('formations.quiz.start');
    Route::post('/formations/{formation}/certify/{apprenant}', [FormationController::class, 'certifyApprenant'])->name('formations.certify');

    // Routes pour vérifier l'inscription et le paiement
    Route::get('/inscriptions/check/{formation}', [InscriptionController::class, 'check'])->name('inscriptions.check');
    Route::get('/paiements/check/{formation}', [PaiementController::class, 'check'])->name('paiements.check');

    // Route pour les leçons d'une formation (protégée uniquement par auth:sanctum)
    Route::get('/formations/{formation}/lecons', [FormationController::class, 'getLecons'])->name('formations.lecons.index');

    // Routes pour ajouter des leçons (réservées aux formateurs)
    Route::post('/formations/{formation}/lecons', [FormationController::class, 'storeLecon'])->name('formations.lecons.store');

    // Routes pour les quiz d'une formation
    Route::get('/formations/{formation}/quiz', [QuizController::class, 'getByFormation'])->name('formations.quiz.index');
    Route::post('/formations/{formation}/quiz', [QuizController::class, 'create'])->name('formations.quiz.store');
    Route::post('/quiz/{quiz}/questions', [QuizController::class, 'addQuestion'])->name('quiz.questions.store');
    Route::get('/quiz/{quiz}/questions', [QuizController::class, 'getQuestions'])->name('quiz.questions');
    Route::post('/quiz/{quiz}/submit', [QuizController::class, 'submit'])->name('quiz.submit');
    Route::post('/formations/{formation}/start-user-quiz', [QuizController::class, 'startUserQuiz'])->middleware('auth:sanctum'); // Corrigé ici
    Route::get('/quiz/{quiz}/reponses', [ReponseController::class, 'getByQuiz'])->name('quiz.reponses.index');
    Route::get('/formations/{formation}/can-start-quiz', [QuizController::class, 'canStartQuiz'])->name('formations.quiz.can-start');

    // Ressources CRUD (routes standardisées)
    Route::apiResource('users', UserController::class);
    Route::apiResource('formations', FormationController::class)->except(['index', 'show']);
    Route::apiResource('inscriptions', InscriptionController::class);
    Route::apiResource('lecons', LeconController::class);
    Route::apiResource('quiz', QuizController::class)->except(['index', 'show']);
    Route::apiResource('questions', QuestionController::class);
    Route::apiResource('reponses', ReponseController::class);
    Route::apiResource('quiz-attempts', QuizAttemptController::class);
    Route::apiResource('paiements', PaiementController::class);
    Route::apiResource('certificats', CertificatController::class);
    Route::apiResource('sessions', SessionController::class)->only(['index', 'show', 'destroy']);
});