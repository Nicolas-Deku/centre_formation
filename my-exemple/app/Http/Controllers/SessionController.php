<?php

namespace App\Http\Controllers;

use App\Models\Session;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class SessionController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $sessions = Session::with('user')->get();
            Log::info('Sessions récupérées', ['count' => $sessions->count()]);
            return response()->json($sessions);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des sessions', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur serveur'], 500);
        }
    }

    public function show($id)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $session = Session::with('user')->findOrFail($id);
            return response()->json($session);
        } catch (\Exception $e) {
            Log::error('Session non trouvée', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Session non trouvée'], 404);
        }
    }

    public function destroy($id)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        try {
            $session = Session::findOrFail($id);
            $session->delete();
            Log::info('Session supprimée', ['session_id' => $id]);
            return response()->json(['message' => 'Session supprimée']);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression de la session', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }
}