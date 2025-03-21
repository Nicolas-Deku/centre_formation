<?php

namespace App\Http\Controllers;

use App\Models\Formation;
use App\Models\Lecon;
use App\Models\Quiz;
use App\Models\Inscription;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class FormationController extends Controller
{
    public function index()
    {
        try {
            $formations = Formation::with('formateur')->get();
            Log::info('Formations récupérées', ['count' => $formations->count()]);
            return response()->json($formations->map(function ($formation) {
                return [
                    'id' => $formation->id,
                    'titre' => $formation->titre,
                    'description' => $formation->description,
                    'categorie' => $formation->categorie,
                    'prix' => $formation->prix,
                    'duree' => $formation->duree,
                    'image_url' => $formation->image, // Renomme image en image_url
                    'formateur_id' => $formation->formateur_id,
                ];
            }));
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des formations', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur serveur'], 500);
        }
    }

    public function formateurFormations(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role !== 'formateur') {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }

            $formations = Formation::where('formateur_id', $user->id)
                ->with('formateur')
                ->get();

            Log::info('Formations du formateur récupérées', [
                'formateur_id' => $user->id,
                'count' => $formations->count()
            ]);
            return response()->json($formations->map(function ($formation) {
                return [
                    'id' => $formation->id,
                    'titre' => $formation->titre,
                    'description' => $formation->description,
                    'categorie' => $formation->categorie,
                    'prix' => $formation->prix,
                    'duree' => $formation->duree,
                    'image_url' => $formation->image, // Renomme image en image_url
                    'formateur_id' => $formation->formateur_id,
                ];
            }));
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des formations du formateur', [
                'error' => $e->getMessage()
            ]);
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
                'titre' => 'required|string|max:255',
                'description' => 'required|string',
                'categorie' => 'required|string|max:255',
                'prix' => 'required|numeric|min:0',
                'duree' => 'required|integer|min:1',
                'image' => 'nullable|image|max:2048',
            ]);

            $imagePath = $request->file('image') ? $request->file('image')->store('formations', 'public') : null;

            $formation = Formation::create([
                'titre' => $validated['titre'],
                'description' => $validated['description'],
                'categorie' => $validated['categorie'],
                'prix' => $validated['prix'],
                'duree' => $validated['duree'],
                'image' => $imagePath,
                'formateur_id' => $user->id,
            ]);

            Log::info('Formation créée', ['formation_id' => $formation->id]);
            return response()->json([
                'id' => $formation->id,
                'titre' => $formation->titre,
                'description' => $formation->description,
                'categorie' => $formation->categorie,
                'prix' => $formation->prix,
                'duree' => $formation->duree,
                'image_url' => $formation->image, // Renomme image en image_url
                'formateur_id' => $formation->formateur_id,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de la formation', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la création'], 500);
        }
    }

    public function show($id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        try {
            $formation = Formation::with('formateur')->findOrFail($id);
            return response()->json([
                'id' => $formation->id,
                'titre' => $formation->titre,
                'description' => $formation->description,
                'categorie' => $formation->categorie,
                'prix' => $formation->prix,
                'duree' => $formation->duree,
                'image_url' => $formation->image, // Renomme image en image_url
                'formateur_id' => $formation->formateur_id,
            ]);
        } catch (\Exception $e) {
            Log::error('Formation non trouvée', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Formation non trouvée'], 404);
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
            $formation = Formation::findOrFail($id);
            if ($formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à modifier cette formation'], 403);
            }

            $validated = $request->validate([
                'titre' => 'sometimes|string|max:255',
                'description' => 'sometimes|string',
                'categorie' => 'sometimes|string|max:255',
                'prix' => 'sometimes|numeric|min:0',
                'duree' => 'sometimes|integer|min:1',
                'image' => 'nullable|image|max:2048',
            ]);

            if ($request->hasFile('image')) {
                $validated['image'] = $request->file('image')->store('formations', 'public');
            }

            $formation->update($validated);
            Log::info('Formation mise à jour', ['formation_id' => $id]);
            return response()->json([
                'id' => $formation->id,
                'titre' => $formation->titre,
                'description' => $formation->description,
                'categorie' => $formation->categorie,
                'prix' => $formation->prix,
                'duree' => $formation->duree,
                'image_url' => $formation->image, // Renomme image en image_url
                'formateur_id' => $formation->formateur_id,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour de la formation', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la mise à jour'], 500);
        }
    }
    public function getApprenants($formationId)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'formateur') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }
    
        try {
            $formation = Formation::findOrFail($formationId);
            if ($formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à voir les apprenants de cette formation'], 403);
            }
    
            $inscriptions = Inscription::where('formation_id', $formationId)
                ->with(['user', 'formation'])
                ->get();
    
            Log::info('Inscriptions récupérées', [
                'formation_id' => $formationId,
                'count' => $inscriptions->count(),
                'inscriptions' => $inscriptions->toArray()
            ]);
    
            $apprenants = $inscriptions->map(function ($inscription) use ($formationId) {
                $latestAttempt = QuizAttempt::where('user_id', $inscription->user_id)
                    ->where('formation_id', $formationId)
                    ->orderBy('created_at', 'desc')
                    ->first();
    
                Log::info('Données de l\'inscription', [
                    'inscription_id' => $inscription->id,
                    'user' => $inscription->user ? $inscription->user->toArray() : null,
                    'formation' => $inscription->formation ? $inscription->formation->toArray() : null,
                    'latest_attempt' => $latestAttempt ? $latestAttempt->toArray() : null
                ]);
    
                return [
                    'id' => $inscription->id,
                    'user' => $inscription->user ? [
                        'id' => $inscription->user->id,
                        'name' => $inscription->user->name,
                        'email' => $inscription->user->email,
                    ] : null,
                    'formation' => $inscription->formation ? [
                        'id' => $inscription->formation->id,
                        'titre' => $inscription->formation->titre,
                    ] : null,
                    'statut' => $inscription->statut,
                    'isPaid' => $inscription->is_paid,
                    'hasPassedQuiz' => $inscription->has_passed_quiz,
                    'score' => $latestAttempt ? $latestAttempt->score : null,
                    'isActiveInQuiz' => $latestAttempt ? $latestAttempt->is_active : false,
                    'certified' => $inscription->certified ?? false,
                ];
            });
    
            Log::info('Apprenants transformés', [
                'formation_id' => $formationId,
                'apprenants' => $apprenants->toArray()
            ]);
    
            return response()->json($apprenants);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des apprenants', ['formation_id' => $formationId, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la récupération des apprenants'], 500);
        }
    }

    public function certifyApprenant($formationId, $apprenantId)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'formateur') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $formation = Formation::findOrFail($formationId);
            if ($formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à certifier un apprenant pour cette formation'], 403);
            }

            $inscription = Inscription::where('formation_id', $formationId)
                ->where('user_id', $apprenantId)
                ->firstOrFail();

            if (!$inscription->has_passed_quiz) {
                return response()->json(['message' => 'Cet apprenant n’a pas réussi le quiz et ne peut pas être certifié'], 403);
            }

            $inscription->certified = true;
            $inscription->save();

            Log::info('Apprenant certifié', ['user_id' => $apprenantId, 'formation_id' => $formationId]);
            return response()->json(['message' => 'Apprenant certifié avec succès']);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la certification de l’apprenant', [
                'formation_id' => $formationId,
                'apprenant_id' => $apprenantId,
                'error' => $e->getMessage()
            ]);
            return response()->json(['message' => 'Erreur lors de la certification de l’apprenant'], 500);
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
            $formation = Formation::findOrFail($id);
            if ($formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à supprimer cette formation'], 403);
            }

            $formation->delete();
            Log::info('Formation supprimée', ['formation_id' => $id]);
            return response()->json(['message' => 'Formation supprimée']);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression de la formation', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }

    public function storeLecon(Request $request, $formationId)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'formateur') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $formation = Formation::findOrFail($formationId);
            if ($formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à ajouter une leçon à cette formation'], 403);
            }

            $validated = $request->validate([
                'titre' => 'required|string|max:255',
                'contenu' => 'required|string',
                'ordre' => 'required|integer|min:0',
            ]);

            $lecon = Lecon::create([
                'titre' => $validated['titre'],
                'contenu' => $validated['contenu'],
                'ordre' => $validated['ordre'],
                'formation_id' => $formationId,
            ]);

            Log::info('Leçon créée', ['lecon_id' => $lecon->id, 'formation_id' => $formationId]);
            return response()->json($lecon, 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de la leçon', ['formation_id' => $formationId, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la création'], 500);
        }
    }

    public function getQuiz($formationId)
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role !== 'formateur') {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }

            $formation = Formation::findOrFail($formationId);
            if ($formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à voir les quiz de cette formation'], 403);
            }

            $quiz = Quiz::where('formation_id', $formationId)->get();
            Log::info('Quiz récupérés', ['formation_id' => $formationId, 'count' => $quiz->count()]);
            return response()->json($quiz);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des quiz', ['formation_id' => $formationId, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur serveur'], 500);
        }
    }

    public function storeQuiz(Request $request, $formationId)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'formateur') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $formation = Formation::findOrFail($formationId);
            if ($formation->formateur_id !== $user->id) {
                return response()->json(['message' => 'Vous n’êtes pas autorisé à ajouter un quiz à cette formation'], 403);
            }

            $validated = $request->validate([
                'titre' => 'required|string|max:255',
                'ordre' => 'required|integer|min:0',
            ]);

            $quiz = Quiz::create([
                'titre' => $validated['titre'],
                'ordre' => $validated['ordre'],
                'formation_id' => $formationId,
            ]);

            Log::info('Quiz créé', ['quiz_id' => $quiz->id, 'formation_id' => $formationId]);
            return response()->json($quiz, 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création du quiz', ['formation_id' => $formationId, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la création'], 500);
        }
    }

    public function getLecons($formationId)
    {
        // L'authentification est déjà gérée par le middleware auth:sanctum
        $user = Auth::user();

        try {
            $formation = Formation::findOrFail($formationId);

            // Récupérer les leçons pour tous les utilisateurs authentifiés
            $lecons = Lecon::where('formation_id', $formationId)
                           ->orderBy('ordre')
                           ->get();

            Log::info('Leçons récupérées pour l’utilisateur authentifié', [
                'formation_id' => $formationId,
                'user_id' => $user->id,
                'count' => $lecons->count(),
                'lecons' => $lecons->toArray() // Ajout pour voir les données exactes
            ]);

            return response()->json(['success' => true, 'lecons' => $lecons]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des leçons', [
                'formation_id' => $formationId,
                'error' => $e->getMessage()
            ]);
            return response()->json(['success' => false, 'message' => 'Erreur lors de la récupération des leçons'], 500);
        }
    }
   
}