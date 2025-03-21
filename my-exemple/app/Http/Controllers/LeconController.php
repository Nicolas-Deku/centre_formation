<?php

namespace App\Http\Controllers;

use App\Models\Lecon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class LeconController extends Controller
{
    public function index()
    {
        try {
            $lecons = Lecon::with('formation')->get();
            Log::info('Leçons récupérées', ['count' => $lecons->count()]);
            return response()->json($lecons);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des leçons', ['error' => $e->getMessage()]);
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
                'contenu' => 'required|string',
                'ordre' => 'required|integer|min:0',
            ]);

            $formation = \App\Models\Formation::findOrFail($validated['formation_id']);
            if ($formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à ajouter une leçon à cette formation'], 403);
            }

            $lecon = Lecon::create($validated);
            Log::info('Leçon créée', ['lecon_id' => $lecon->id]);
            return response()->json($lecon, 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de la leçon', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la création'], 500);
        }
    }

    public function show($id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        try {
            $lecon = Lecon::with('formation')->findOrFail($id);
            return response()->json($lecon);
        } catch (\Exception $e) {
            Log::error('Leçon non trouvée', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Leçon non trouvée'], 404);
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
            $lecon = Lecon::findOrFail($id);
            if ($lecon->formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à modifier cette leçon'], 403);
            }

            $validated = $request->validate([
                'titre' => 'sometimes|string|max:255',
                'contenu' => 'sometimes|string',
                'ordre' => 'sometimes|integer|min:0',
            ]);

            $lecon->update($validated);
            Log::info('Leçon mise à jour', ['lecon_id' => $id]);
            return response()->json($lecon);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour de la leçon', ['id' => $id, 'error' => $e->getMessage()]);
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
            $lecon = Lecon::findOrFail($id);
            if ($lecon->formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à supprimer cette leçon'], 403);
            }

            $lecon->delete();
            Log::info('Leçon supprimée', ['lecon_id' => $id]);
            return response()->json(['message' => 'Leçon supprimée']);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression de la leçon', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }
}