<?php

namespace App\Http\Controllers;

use App\Models\Reponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\Quiz;

class ReponseController extends Controller
{
    public function index()
    {
        try {
            $reponses = Reponse::with('question')->get();
            Log::info('Réponses récupérées', ['count' => $reponses->count()]);
            return response()->json($reponses);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des réponses', ['error' => $e->getMessage()]);
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
                'question_id' => 'required|exists:questions,id',
                'reponse' => 'required|string',
                'est_correcte' => 'required|boolean', // Changement : est_correct -> est_correcte
            ]);

            $question = \App\Models\Question::findOrFail($validated['question_id']);
            if ($question->quiz->formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à ajouter une réponse à cette question'], 403);
            }

            $reponse = Reponse::create($validated);
            Log::info('Réponse créée', ['reponse_id' => $reponse->id]);
            return response()->json($reponse, 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de la réponse', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la création'], 500);
        }
    }

    public function show($id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        try {
            $reponse = Reponse::with('question')->findOrFail($id);
            return response()->json($reponse);
        } catch (\Exception $e) {
            Log::error('Réponse non trouvée', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Réponse non trouvée'], 404);
        }
    }

    public function getByQuiz($quizId)
    {
        try {
            $quiz = Quiz::findOrFail($quizId);
            $reponses = Reponse::whereIn('question_id', function ($query) use ($quizId) {
                $query->select('id')->from('questions')->where('quiz_id', $quizId);
            })->get();

            Log::info('Réponses récupérées pour le quiz', ['quiz_id' => $quizId, 'count' => $reponses->count()]);
            return response()->json($reponses);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des réponses', ['quiz_id' => $quizId, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur serveur'], 500);
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
            $reponse = Reponse::findOrFail($id);
            if ($reponse->question->quiz->formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à modifier cette réponse'], 403);
            }

            $validated = $request->validate([
                'reponse' => 'sometimes|string',
                'est_correcte' => 'sometimes|boolean', // Changement : est_correct -> est_correcte
            ]);

            $reponse->update($validated);
            Log::info('Réponse mise à jour', ['reponse_id' => $id]);
            return response()->json($reponse);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour de la réponse', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la mise à jour'], 500);
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
            $reponse = Reponse::findOrFail($id);
            if ($reponse->question->quiz->formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à supprimer cette réponse'], 403);
            }

            $reponse->delete();
            Log::info('Réponse supprimée', ['reponse_id' => $id]);
            return response()->json(['message' => 'Réponse supprimée']);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression de la réponse', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }
}