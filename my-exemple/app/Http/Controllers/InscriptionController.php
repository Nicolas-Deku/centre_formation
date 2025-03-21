<?php

namespace App\Http\Controllers;

use App\Models\Inscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class InscriptionController extends Controller
{
    public function index()
{
    try {
        $user = Auth::user();
        $inscriptions = Inscription::where('user_id', $user->id)
            ->with(['user', 'formation'])
            ->get();
        Log::info('Inscriptions récupérées', ['count' => $inscriptions->count()]);
        return response()->json($inscriptions);
    } catch (\Exception $e) {
        Log::error('Erreur lors de la récupération des inscriptions', ['error' => $e->getMessage()]);
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
        ]);

        $inscription = Inscription::create([
            'user_id' => $user->id,
            'formation_id' => $validated['formation_id'],
            'statut' => 'en_attente',
            'is_paid' => false,
        ]);

        // Charger la relation formation
        $inscription->load('formation');

        Log::info('Inscription créée', ['inscription_id' => $inscription->id]);
        return response()->json($inscription, 201);
    } catch (\Exception $e) {
        Log::error('Erreur lors de la création de l’inscription', ['error' => $e->getMessage()]);
        return response()->json(['message' => 'Erreur lors de la création'], 500);
    }
}

    public function show($id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        try {
            $inscription = Inscription::with(['user', 'formation'])->findOrFail($id);
            return response()->json($inscription);
        } catch (\Exception $e) {
            Log::error('Inscription non trouvée', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Inscription non trouvée'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        try {
            $inscription = Inscription::findOrFail($id);
            $user = Auth::user();
            if (!$user || ($user->role !== 'admin' && $user->id !== $inscription->user_id)) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }

            $validated = $request->validate([
                'statut' => 'sometimes|in:en_attente,validé,terminé',
                'is_paid' => 'sometimes|boolean',
                'score' => 'sometimes|numeric|min:0|max:100',
                'has_passed_quiz' => 'sometimes|boolean',
                'certified' => 'sometimes|boolean',
            ]);

            $inscription->update($validated);
            Log::info('Inscription mise à jour', ['inscription_id' => $id]);
            return response()->json($inscription);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour de l’inscription', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la mise à jour'], 500);
        }
    }

    public function destroy($id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        try {
            $inscription = Inscription::findOrFail($id);
            $user = Auth::user();
            if (!$user || ($user->role !== 'admin' && $user->id !== $inscription->user_id)) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }

            $inscription->delete();
            Log::info('Inscription supprimée', ['inscription_id' => $id]);
            return response()->json(['message' => 'Inscription supprimée']);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression de l’inscription', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }
    public function check($formationId)
{
    $user = Auth::user();
    if (!$user) {
        return response()->json(['is_enrolled' => false], 401);
    }

    $inscription = Inscription::where('user_id', $user->id)
        ->where('formation_id', $formationId)
        ->first();

    return response()->json(['is_enrolled' => !!$inscription]);
}
}