<?php

namespace App\Http\Controllers;

use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class QuestionController extends Controller
{
    public function index()
    {
        try {
            $questions = Question::with('quiz')->get();
            Log::info('Questions récupérées', ['count' => $questions->count()]);
            return response()->json($questions);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des questions', ['error' => $e->getMessage()]);
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
                'quiz_id' => 'required|exists:quiz,id',
                'question' => 'required|string',
                'type' => 'required|in:choix_multiple,vrai_faux,texte',
            ]);

            $quiz = \App\Models\Quiz::findOrFail($validated['quiz_id']);
            if ($quiz->formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à ajouter une question à ce quiz'], 403);
            }

            $question = Question::create($validated);
            Log::info('Question créée', ['question_id' => $question->id]);
            return response()->json($question, 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de la question', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la création'], 500);
        }
    }

    public function show($id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        try {
            $question = Question::with('quiz')->findOrFail($id);
            return response()->json($question);
        } catch (\Exception $e) {
            Log::error('Question non trouvée', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Question non trouvée'], 404);
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
            $question = Question::findOrFail($id);
            if ($question->quiz->formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à modifier cette question'], 403);
            }

            $validated = $request->validate([
                'question' => 'sometimes|string',
                'type' => 'sometimes|in:choix_multiple,vrai_faux,texte',
            ]);

            $question->update($validated);
            Log::info('Question mise à jour', ['question_id' => $id]);
            return response()->json($question);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour de la question', ['id' => $id, 'error' => $e->getMessage()]);
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
            $question = Question::findOrFail($id);
            if ($question->quiz->formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à supprimer cette question'], 403);
            }

            $question->delete();
            Log::info('Question supprimée', ['question_id' => $id]);
            return response()->json(['message' => 'Question supprimée']);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression de la question', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }
}