<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\Question;
use App\Models\QuizAttempt;
use App\Models\Reponse;
use App\Models\QuizAttemptAnswer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class QuizController extends Controller
{
    public function index()
    {
        try {
            $quiz = Quiz::with('formation')->get();
            Log::info('Quiz récupérés', ['count' => $quiz->count()]);
            return response()->json($quiz);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des quiz', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur serveur'], 500);
        }
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'formateur') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $validated = $request->validate([
                'formation_id' => 'required|exists:formations,id',
                'titre' => 'required|string|max:255',
                'ordre' => 'required|integer|min:0',
            ]);

            $formation = \App\Models\Formation::findOrFail($validated['formation_id']);
            if ($formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à ajouter un quiz à cette formation'], 403);
            }

            $quiz = Quiz::create($validated);
            Log::info('Quiz créé', ['quiz_id' => $quiz->id]);
            return response()->json($quiz, 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création du quiz', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la création'], 500);
        }
    }

    public function show($id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        try {
            $quiz = Quiz::with('formation')->findOrFail($id);
            return response()->json($quiz);
        } catch (\Exception $e) {
            Log::error('Quiz non trouvé', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Quiz non trouvé'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        $user = Auth::user();
        if (!$user || $user->role !== 'formateur') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $quiz = Quiz::findOrFail($id);
            if ($quiz->formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à modifier ce quiz'], 403);
            }

            $validated = $request->validate([
                'titre' => 'sometimes|string|max:255',
                'ordre' => 'sometimes|integer|min:0',
            ]);

            $quiz->update($validated);
            Log::info('Quiz mis à jour', ['quiz_id' => $id]);
            return response()->json($quiz);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour du quiz', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la mise à jour'], 500);
        }
    }

    public function startQuiz(Request $request, $formationId)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'formateur') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $formation = \App\Models\Formation::findOrFail($formationId);
            if ($formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à démarrer un quiz pour cette formation'], 403);
            }

            $quiz = Quiz::where('formation_id', $formationId)->first();
            if (!$quiz) {
                return response()->json(['message' => 'Aucun quiz trouvé pour cette formation'], 404);
            }

            $duration = $request->input('duration'); // En minutes
            if (!$duration || !is_numeric($duration) || $duration <= 0) {
                return response()->json(['message' => 'Durée invalide'], 400);
            }

            $quiz->started_at = Carbon::now();
            $quiz->duration = $duration;
            $quiz->save();

            // Mettre à jour les tentatives des apprenants pour indiquer qu'ils sont actifs
            $inscriptions = \App\Models\Inscription::where('formation_id', $formationId)->get();
            foreach ($inscriptions as $inscription) {
                QuizAttempt::create([
                    'user_id' => $inscription->user_id,
                    'formation_id' => $formationId,
                    'quiz_id' => $quiz->id,
                    'is_active' => true,
                    'started_at' => Carbon::now(),
                ]);
            }

            $remainingTime = $duration * 60; // Convertir en secondes
            Log::info('Quiz démarré', ['quiz_id' => $quiz->id, 'duration' => $duration]);
            return response()->json(['message' => 'Quiz démarré', 'remaining_time' => $remainingTime]);
        } catch (\Exception $e) {
            Log::error('Erreur lors du démarrage du quiz', ['formation_id' => $formationId, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors du démarrage du quiz'], 500);
        }
    }

    public function canStartQuiz($formationId)
    {
        try {
            $formation = \App\Models\Formation::findOrFail($formationId);
            $quiz = Quiz::where('formation_id', $formationId)->first();
            if (!$quiz) {
                return response()->json(['message' => 'Aucun quiz trouvé pour cette formation'], 404);
            }

            $quizStartedAt = $quiz->started_at;
            $quizDuration = $quiz->duration;

            if (!$quizStartedAt || !$quizDuration) {
                return response()->json([
                    'quiz_started' => false,
                    'remaining_time' => 0,
                ]);
            }

            $startTime = Carbon::parse($quizStartedAt);
            $endTime = $startTime->copy()->addMinutes($quizDuration);
            $now = Carbon::now();

            if ($now->greaterThan($endTime)) {
                // Mettre à jour les tentatives pour indiquer qu'elles ne sont plus actives
                QuizAttempt::where('formation_id', $formationId)
                    ->where('quiz_id', $quiz->id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);

                return response()->json([
                    'quiz_started' => false,
                    'remaining_time' => 0,
                ]);
            }

            $remainingTime = $now->diffInSeconds($endTime, false);
            return response()->json([
                'quiz_started' => true,
                'remaining_time' => max(0, $remainingTime),
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la vérification de l’état du quiz', ['formation_id' => $formationId, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la vérification de l’état du quiz'], 500);
        }
    }

    public function startUserQuiz(Request $request, $formationId)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'apprenant') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $formation = \App\Models\Formation::findOrFail($formationId);
            $quiz = Quiz::where('formation_id', $formationId)->first();
            if (!$quiz) {
                return response()->json(['message' => 'Aucun quiz trouvé pour cette formation'], 404);
            }

            // Vérifier si l'utilisateur est inscrit et a payé
            $inscription = \App\Models\Inscription::where('user_id', $user->id)
                ->where('formation_id', $formationId)
                ->first();
            if (!$inscription || !$inscription->is_paid) {
                return response()->json(['message' => 'Vous devez être inscrit et avoir payé pour démarrer ce quiz'], 403);
            }

            // Vérifier si le quiz est actif
            $quizStartedAt = $quiz->started_at;
            $quizDuration = $quiz->duration;
            if (!$quizStartedAt || !$quizDuration) {
                return response()->json(['message' => 'Le quiz n’a pas encore été démarré par le formateur'], 403);
            }

            $startTime = Carbon::parse($quizStartedAt);
            $endTime = $startTime->copy()->addMinutes($quizDuration);
            $now = Carbon::now();

            if ($now->greaterThan($endTime)) {
                return response()->json(['message' => 'Le temps pour ce quiz est écoulé'], 403);
            }

            // Vérifier si une tentative existe déjà
            $attempt = QuizAttempt::where('user_id', $user->id)
                ->where('quiz_id', $quiz->id)
                ->where('formation_id', $formationId)
                ->where('is_active', true)
                ->first();

            if (!$attempt) {
                $attempt = QuizAttempt::create([
                    'user_id' => $user->id,
                    'formation_id' => $formationId,
                    'quiz_id' => $quiz->id,
                    'is_active' => true,
                    'started_at' => Carbon::now(),
                ]);
            }

            Log::info('Quiz démarré pour l’utilisateur', ['user_id' => $user->id, 'quiz_id' => $quiz->id]);
            return response()->json(['message' => 'Quiz démarré pour l’utilisateur', 'attempt_id' => $attempt->id]);
        } catch (\Exception $e) {
            Log::error('Erreur lors du démarrage du quiz pour l’utilisateur', ['formation_id' => $formationId, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors du démarrage du quiz'], 500);
        }
    }

    public function getQuestions($quizId)
    {
        try {
            $quiz = Quiz::findOrFail($quizId);
            $questions = $quiz->questions()->with('reponses')->get();
            return response()->json($questions);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des questions', ['quiz_id' => $quizId, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la récupération des questions'], 500);
        }
    }

    public function submit(Request $request, $quizId)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'apprenant') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $quiz = Quiz::findOrFail($quizId);
            $answers = $request->input('answers');

            if (!$answers || !is_array($answers)) {
                return response()->json(['message' => 'Réponses invalides'], 400);
            }

            // Vérifier si une tentative active existe
            $attempt = QuizAttempt::where('quiz_id', $quizId)
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$attempt) {
                return response()->json(['message' => 'Aucune tentative active trouvée pour ce quiz'], 404);
            }

            // Vérifier si le quiz est encore actif
            $quizStartedAt = $quiz->started_at;
            $quizDuration = $quiz->duration;
            if ($quizStartedAt && $quizDuration) {
                $startTime = Carbon::parse($quizStartedAt);
                $endTime = $startTime->copy()->addMinutes($quizDuration);
                $now = Carbon::now();

                if ($now->greaterThan($endTime)) {
                    $attempt->is_active = false;
                    $attempt->completed_at = $endTime;
                    $attempt->save();
                    return response()->json(['message' => 'Le temps pour ce quiz est écoulé'], 403);
                }
            }

            $questions = $quiz->questions()->with('reponses')->get();
            $totalQuestions = $questions->count();
            $correctAnswers = 0;

            foreach ($answers as $answer) {
                $question = $questions->firstWhere('id', $answer['question_id']);
                if (!$question) continue;

                $isCorrect = false;

                if ($question->type === 'choix_multiple') {
                    $correctReponse = $question->reponses->firstWhere('est_correcte', true);
                    if ($correctReponse && isset($answer['reponse_id']) && $answer['reponse_id'] == $correctReponse->id) {
                        $isCorrect = true;
                        $correctAnswers++;
                    }
                } elseif ($question->type === 'vrai_faux') {
                    $correctValue = $question->reponse_correcte === 'vrai' ? true : false;
                    if (isset($answer['reponse_vrai_faux']) && $answer['reponse_vrai_faux'] === $correctValue) {
                        $isCorrect = true;
                        $correctAnswers++;
                    }
                } elseif ($question->type === 'texte') {
                    // Pour les réponses textuelles, une évaluation manuelle peut être nécessaire
                    // Ici, on peut considérer que la réponse est correcte si elle n'est pas vide
                    if (!empty($answer['reponse_texte'])) {
                        $isCorrect = true;
                        $correctAnswers++;
                    }
                }

                // Enregistrer la réponse soumise
                QuizAttemptAnswer::create([
                    'quiz_attempt_id' => $attempt->id,
                    'question_id' => $answer['question_id'],
                    'reponse_id' => $answer['reponse_id'] ?? null,
                    'reponse_vrai_faux' => $answer['reponse_vrai_faux'] ?? null,
                    'reponse_texte' => $answer['reponse_texte'] ?? null,
                    'is_correct' => $isCorrect,
                ]);
            }

            $score = $totalQuestions > 0 ? ($correctAnswers / $totalQuestions) * 100 : 0;
            $hasPassed = $score >= 50;

            // Mettre à jour la tentative
            $attempt->score = $score;
            $attempt->is_active = false;
            $attempt->completed_at = Carbon::now();
            $attempt->save();

            // Mettre à jour l'inscription pour indiquer si l'utilisateur a réussi le quiz
            $inscription = \App\Models\Inscription::where('user_id', $user->id)
                ->where('formation_id', $quiz->formation_id)
                ->first();
            if ($inscription) {
                $inscription->has_passed_quiz = $hasPassed;
                $inscription->save();
            }

            Log::info('Quiz soumis', ['user_id' => $user->id, 'quiz_id' => $quizId, 'score' => $score]);
            return response()->json(['score' => round($score, 2), 'hasPassedQuiz' => $hasPassed]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la soumission du quiz', ['quiz_id' => $quizId, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la soumission du quiz'], 500);
        }
    }

    public function destroy($id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        $user = Auth::user();
        if (!$user || $user->role !== 'formateur') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $quiz = Quiz::findOrFail($id);
            if ($quiz->formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à supprimer ce quiz'], 403);
            }

            $quiz->delete();
            Log::info('Quiz supprimé', ['quiz_id' => $id]);
            return response()->json(['message' => 'Quiz supprimé']);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression du quiz', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }

    public function getByFormation($formationId)
    {
        try {
            $quizzes = Quiz::where('formation_id', $formationId)->get();
            return response()->json($quizzes);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des quiz par formation', ['formation_id' => $formationId, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la récupération des quiz'], 500);
        }
    }

    public function create(Request $request, $formationId)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'formateur') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $formation = \App\Models\Formation::findOrFail($formationId);
            if ($formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à créer un quiz pour cette formation'], 403);
            }

            $validated = $request->validate([
                'titre' => 'required|string|max:255',
                'ordre' => 'required|integer|min:0',
            ]);

            $quiz = Quiz::create([
                'titre' => $validated['titre'],
                'ordre' => $validated['ordre'],
                'formation_id' => $formationId
            ]);

            Log::info('Quiz créé', ['quiz_id' => $quiz->id]);
            return response()->json($quiz, 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création du quiz', ['formation_id' => $formationId, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la création du quiz'], 500);
        }
    }

    public function addQuestion(Request $request, $quizId)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'formateur') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $quiz = Quiz::findOrFail($quizId);
            if ($quiz->formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à ajouter une question à ce quiz'], 403);
            }

            $validated = $request->validate([
                'question' => 'required|string',
                'type' => 'required|in:choix_multiple,vrai_faux,texte',
                'reponse_correcte' => 'required_if:type,vrai_faux|in:vrai,faux'
            ]);

            $question = Question::create([
                'quiz_id' => $quiz->id,
                'question' => $validated['question'],
                'type' => $validated['type'],
                'reponse_correcte' => $validated['type'] === 'vrai_faux' ? $validated['reponse_correcte'] : null,
            ]);

            Log::info('Question ajoutée', ['question_id' => $question->id, 'quiz_id' => $quizId]);
            return response()->json($question, 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l’ajout de la question', ['quiz_id' => $quizId, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de l’ajout de la question'], 500);
        }
    }

    public function getByQuiz($quizId)
    {
        try {
            $quiz = Quiz::findOrFail($quizId);
            $questions = $quiz->questions()->with('reponses')->get();
            $responses = $questions->flatMap->reponses;
            return response()->json($responses);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des réponses par quiz', ['quiz_id' => $quizId, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la récupération des réponses'], 500);
        }
    }
}