<?php

namespace App\Http\Controllers;

use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class QuizAttemptController extends Controller
{
    public function index()
    {
        try {
            $attempts = QuizAttempt::with(['user', 'formation', 'quiz'])->get();
            Log::info('Tentatives de quiz récupérées', ['count' => $attempts->count()]);
            return response()->json($attempts);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des tentatives', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur serveur'], 500);
        }
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'apprenant') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $validated = $request->validate([
                'formation_id' => 'required|exists:formations,id',
                'quiz_id' => 'nullable|exists:quiz,id',
            ]);

            $attempt = QuizAttempt::create([
                'user_id' => $user->id,
                'formation_id' => $validated['formation_id'],
                'quiz_id' => $validated['quiz_id'] ?? null,
                'is_active' => true,
                'started_at' => now(),
            ]);

            Log::info('Tentative de quiz créée', ['attempt_id' => $attempt->id]);
            return response()->json($attempt, 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de la tentative', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la création'], 500);
        }
    }

    public function show($id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        try {
            $attempt = QuizAttempt::with(['user', 'formation', 'quiz'])->findOrFail($id);
            return response()->json($attempt);
        } catch (\Exception $e) {
            Log::error('Tentative non trouvée', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Tentative non trouvée'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        $user = Auth::user();
        if (!$user || ($user->role !== 'apprenant' && $user->role !== 'formateur')) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $attempt = QuizAttempt::findOrFail($id);
            if ($user->role === 'apprenant' && $attempt->user_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à modifier cette tentative'], 403);
            }

            $validated = $request->validate([
                'is_active' => 'sometimes|boolean',
                'completed_at' => 'sometimes|date',
                'score' => 'sometimes|numeric|min:0|max:100',
            ]);

            $attempt->update($validated);
            Log::info('Tentative mise à jour', ['attempt_id' => $id]);
            return response()->json($attempt);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour de la tentative', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la mise à jour'], 500);
        }
    }

    public function destroy($id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        $user = Auth::user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $attempt = QuizAttempt::findOrFail($id);
            $attempt->delete();
            Log::info('Tentative supprimée', ['attempt_id' => $id]);
            return response()->json(['message' => 'Tentative supprimée']);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression de la tentative', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }
}