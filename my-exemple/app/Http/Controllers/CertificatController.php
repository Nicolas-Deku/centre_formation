<?php

namespace App\Http\Controllers;

use App\Models\Certificat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class CertificatController extends Controller
{
    public function index()
    {
        try {
            $certificats = Certificat::with(['user', 'formation'])->get();
            Log::info('Certificats récupérés', ['count' => $certificats->count()]);
            return response()->json($certificats);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des certificats', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur serveur'], 500);
        }
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
                'formation_id' => 'required|exists:formations,id',
                'date_obtention' => 'sometimes|date',
            ]);

            $certificat = Certificat::create($validated);
            Log::info('Certificat créé', ['certificat_id' => $certificat->id]);
            return response()->json($certificat, 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création du certificat', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la création'], 500);
        }
    }

    public function show($id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        try {
            $certificat = Certificat::with(['user', 'formation'])->findOrFail($id);
            return response()->json($certificat);
        } catch (\Exception $e) {
            Log::error('Certificat non trouvé', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Certificat non trouvé'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        $user = Auth::user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $certificat = Certificat::findOrFail($id);
            $validated = $request->validate([
                'date_obtention' => 'sometimes|date',
            ]);

            $certificat->update($validated);
            Log::info('Certificat mis à jour', ['certificat_id' => $id]);
            return response()->json($certificat);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour du certificat', ['id' => $id, 'error' => $e->getMessage()]);
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
            $certificat = Certificat::findOrFail($id);
            $certificat->delete();
            Log::info('Certificat supprimé', ['certificat_id' => $id]);
            return response()->json(['message' => 'Certificat supprimé']);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression du certificat', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }
}