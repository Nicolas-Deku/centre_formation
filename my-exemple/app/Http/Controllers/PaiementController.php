<?php

namespace App\Http\Controllers;

use App\Models\Paiement;
use App\Models\Inscription; // Ajout pour gérer la table inscriptions
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class PaiementController extends Controller
{
    public function index()
    {
        try {
            $paiements = Paiement::with(['user', 'formation'])->get();
            Log::info('Paiements récupérés', ['count' => $paiements->count()]);
            return response()->json($paiements);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des paiements', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Erreur serveur lors de la récupération des paiements'], 500);
        }
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'apprenant') {
            Log::warning('Accès non autorisé lors de la création d’un paiement', ['user_id' => $user ? $user->id : null]);
            return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
        }

        try {
            $validated = $request->validate([
                'formation_id' => 'required|exists:formations,id',
                'montant' => 'required|numeric|min:0',
                'methode' => 'required|in:carte,paypal,virement',
                'transaction_id' => 'required|string|unique:paiements,transaction_id',
            ]);

            // Vérifier si l'utilisateur est inscrit à la formation
            $inscription = Inscription::where('user_id', $user->id)
                ->where('formation_id', $validated['formation_id'])
                ->first();

            if (!$inscription) {
                Log::warning('Utilisateur non inscrit lors de la création d’un paiement', [
                    'user_id' => $user->id,
                    'formation_id' => $validated['formation_id']
                ]);
                return response()->json(['success' => false, 'message' => 'Vous n’êtes pas inscrit à cette formation'], 403);
            }

            // Simuler un paiement réussi en mode local pour les transaction_id commençant par "simulated_txn_"
            if (app()->environment('local') && str_starts_with($validated['transaction_id'], 'simulated_txn_')) {
                $paiement = Paiement::create([
                    'user_id' => $user->id,
                    'formation_id' => $validated['formation_id'],
                    'montant' => $validated['montant'],
                    'methode' => $validated['methode'],
                    'transaction_id' => $validated['transaction_id'],
                    'statut' => 'effectué', // Simuler un paiement réussi
                ]);

                // Mettre à jour is_paid dans la table inscriptions
                $inscription->is_paid = true;
                $inscription->save();

                Log::info('Paiement simulé créé avec succès et inscription mise à jour', [
                    'paiement_id' => $paiement->id,
                    'transaction_id' => $validated['transaction_id'],
                    'inscription_id' => $inscription->id
                ]);
                return response()->json(['success' => true, 'message' => 'Paiement simulé réussi', 'paiement' => $paiement], 201);
            }

            // Logique réelle de création du paiement
            $paiement = Paiement::create([
                'user_id' => $user->id,
                'formation_id' => $validated['formation_id'],
                'montant' => $validated['montant'],
                'methode' => $validated['methode'],
                'transaction_id' => $validated['transaction_id'],
                'statut' => 'en_attente',
            ]);

            Log::info('Paiement créé', ['paiement_id' => $paiement->id, 'transaction_id' => $validated['transaction_id']]);
            return response()->json(['success' => true, 'message' => 'Paiement créé avec succès', 'paiement' => $paiement], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Erreur de validation lors de la création du paiement', ['errors' => $e->errors()]);
            return response()->json(['success' => false, 'message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création du paiement', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Erreur lors de la création du paiement'], 500);
        }
    }

    public function show($id)
    {
        if (!is_numeric($id)) {
            return response()->json(['success' => false, 'message' => 'ID invalide'], 400);
        }

        try {
            $paiement = Paiement::with(['user', 'formation'])->findOrFail($id);
            return response()->json(['success' => true, 'paiement' => $paiement]);
        } catch (\Exception $e) {
            Log::error('Paiement non trouvé', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Paiement non trouvé'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        if (!is_numeric($id)) {
            return response()->json(['success' => false, 'message' => 'ID invalide'], 400);
        }

        $user = Auth::user();
        if (!$user || $user->role !== 'admin') {
            Log::warning('Accès non autorisé lors de la mise à jour d’un paiement', ['user_id' => $user ? $user->id : null]);
            return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
        }

        try {
            $paiement = Paiement::findOrFail($id);
            $validated = $request->validate([
                'statut' => 'sometimes|in:en_attente,effectué,échoué',
                'montant' => 'sometimes|numeric|min:0',
                'methode' => 'sometimes|in:carte,paypal,virement',
            ]);

            $paiement->update($validated);

            // Si le statut du paiement devient 'effectué', mettre à jour is_paid dans inscriptions
            if (isset($validated['statut']) && $validated['statut'] === 'effectué') {
                $inscription = Inscription::where('user_id', $paiement->user_id)
                    ->where('formation_id', $paiement->formation_id)
                    ->first();

                if ($inscription) {
                    $inscription->is_paid = true;
                    $inscription->save();
                    Log::info('Inscription mise à jour après modification du paiement', [
                        'inscription_id' => $inscription->id,
                        'paiement_id' => $paiement->id
                    ]);
                }
            }

            Log::info('Paiement mis à jour', ['paiement_id' => $id]);
            return response()->json(['success' => true, 'message' => 'Paiement mis à jour', 'paiement' => $paiement]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Erreur de validation lors de la mise à jour du paiement', ['id' => $id, 'errors' => $e->errors()]);
            return response()->json(['success' => false, 'message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour du paiement', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Erreur lors de la mise à jour du paiement'], 500);
        }
    }

    public function check($formationId)
    {
        // Validation de formationId
        if (!is_numeric($formationId) || $formationId <= 0) {
            Log::warning('ID de formation invalide lors de la vérification du paiement', ['formation_id' => $formationId]);
            return response()->json(['is_paid' => false, 'message' => 'ID de formation invalide'], 400);
        }

        $user = Auth::user();
        if (!$user) {
            Log::warning('Utilisateur non authentifié lors de la vérification du paiement', ['formation_id' => $formationId]);
            return response()->json(['is_paid' => false, 'message' => 'Utilisateur non authentifié'], 401);
        }

        try {
            // Vérifier si la formation existe
            $formationExists = \App\Models\Formation::where('id', $formationId)->exists();
            if (!$formationExists) {
                Log::warning('Formation non trouvée lors de la vérification du paiement', [
                    'formation_id' => $formationId,
                    'user_id' => $user->id
                ]);
                return response()->json(['is_paid' => false, 'message' => 'Formation non trouvée'], 404);
            }

            // Vérifier l'inscription et l'état is_paid
            $inscription = Inscription::where('user_id', $user->id)
                ->where('formation_id', $formationId)
                ->first();

            if (!$inscription) {
                Log::warning('Utilisateur non inscrit lors de la vérification du paiement', [
                    'user_id' => $user->id,
                    'formation_id' => $formationId
                ]);
                return response()->json(['is_paid' => false, 'message' => 'Non inscrit'], 403);
            }

            Log::info('Vérification du paiement via inscription', [
                'user_id' => $user->id,
                'formation_id' => $formationId,
                'is_paid' => $inscription->is_paid
            ]);

            return response()->json([
                'is_paid' => $inscription->is_paid,
                'message' => $inscription->is_paid ? 'Paiement effectué' : 'Paiement en attente'
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la vérification du paiement', [
                'user_id' => $user->id,
                'formation_id' => $formationId,
                'error' => $e->getMessage()
            ]);
            return response()->json(['is_paid' => false, 'message' => 'Erreur lors de la vérification du paiement'], 500);
        }
    }

    public function destroy($id)
    {
        if (!is_numeric($id)) {
            return response()->json(['success' => false, 'message' => 'ID invalide'], 400);
        }

        $user = Auth::user();
        if (!$user || $user->role !== 'admin') {
            Log::warning('Accès non autorisé lors de la suppression d’un paiement', ['user_id' => $user ? $user->id : null]);
            return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
        }

        try {
            $paiement = Paiement::findOrFail($id);
            $paiement->delete();
            Log::info('Paiement supprimé', ['paiement_id' => $id]);
            return response()->json(['success' => true, 'message' => 'Paiement supprimé']);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression du paiement', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Erreur lors de la suppression du paiement'], 500);
        }
    }
}