<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        try {
            $users = User::all();
            Log::info('Liste des utilisateurs récupérée', ['count' => $users->count()]);
            return response()->json($users);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des utilisateurs', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur serveur'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|unique:users,email',
                'password' => 'required|string|min:8',
                'role' => 'required|in:admin,formateur,apprenant',
            ]);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
            ]);

            Log::info('Utilisateur créé', ['user_id' => $user->id]);
            return response()->json($user, 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de l’utilisateur', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la création'], 500);
        }
    }

    public function show($id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        try {
            $user = User::findOrFail($id);
            return response()->json($user);
        } catch (\Exception $e) {
            Log::error('Utilisateur non trouvé', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        try {
            $user = User::findOrFail($id);
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|string|email|unique:users,email,' . $id,
                'password' => 'sometimes|string|min:8',
                'role' => 'sometimes|in:admin,formateur,apprenant',
            ]);

            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            }

            $user->update($validated);
            Log::info('Utilisateur mis à jour', ['user_id' => $id]);
            return response()->json($user);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour de l’utilisateur', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la mise à jour'], 500);
        }
    }

    public function destroy($id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID invalide'], 400);
        }

        try {
            $user = User::findOrFail($id);
            $user->delete();
            Log::info('Utilisateur supprimé', ['user_id' => $id]);
            return response()->json(['message' => 'Utilisateur supprimé']);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression de l’utilisateur', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }
}