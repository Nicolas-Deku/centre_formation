<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Formation;
use App\Models\Inscription;
use App\Models\Paiement;

class EnsureLeconsAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $formationId = $request->route('formation'); // Récupère l'ID de la formation depuis la route
        $user = auth()->user();

        // Vérifie si l'utilisateur est authentifié
        if (!$user) {
            return response()->json(['error' => 'Utilisateur non authentifié'], 401);
        }

        // Vérifie si l'utilisateur est un apprenant
        if ($user->role !== 'apprenant') {
            return response()->json(['error' => 'Accès non autorisé, vous devez être un apprenant'], 403);
        }

        // Vérifie si la formation existe
        $formation = Formation::find($formationId);
        if (!$formation) {
            return response()->json(['error' => 'Formation non trouvée'], 404);
        }

        // Vérifie si l'utilisateur est inscrit à la formation
        $inscription = Inscription::where('user_id', $user->id)
                                  ->where('formation_id', $formationId)
                                  ->first();
        if (!$inscription) {
            return response()->json(['error' => 'Vous n’êtes pas inscrit à cette formation'], 403);
        }

        // Vérifie si l'utilisateur a payé pour la formation
        $paiement = Paiement::where('formation_id', $formationId)
                            ->where('user_id', $user->id)
                            ->where('statut', 'effectué')
                            ->first();
        if (!$paiement) {
            return response()->json(['error' => 'Vous devez payer pour accéder aux leçons'], 403);
        }

        // Si toutes les vérifications passent, continuez vers la route
        return $next($request);
    }
}