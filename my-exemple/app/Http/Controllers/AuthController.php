<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * Authentifie un utilisateur et retourne un token.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        try {
            $credentials = $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            if (Auth::attempt($credentials)) {
                $user = Auth::user();
                $token = $user->createToken('auth_token')->plainTextToken;

                // Charger les formations si l'utilisateur est un formateur
                $data = [
                    'message' => 'Authentification réussie',
                    'user' => $user,
                    'token' => $token,
                ];

                if ($user->role === 'formateur') {
                    $data['formations'] = $user->formations()->with('formateur')->get();
                }

                Log::info('Utilisateur connecté', ['user_id' => $user->id, 'role' => $user->role]);
                return response()->json($data);
            }

            Log::warning('Tentative de connexion échouée', ['email' => $request->email]);
            return response()->json(['message' => 'Identifiants invalides'], 401);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la connexion', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Enregistre un nouvel utilisateur et retourne un token.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:6|confirmed',
                'role' => 'required|in:apprenant,formateur', // Pas 'admin' lors de l'inscription
            ]);

            $user = User::create([
                'name' => $validatedData['name'],
                'email' => $validatedData['email'],
                'password' => Hash::make($validatedData['password']),
                'role' => $validatedData['role'], // Rôle limité à apprenant ou formateur
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;

            Log::info('Utilisateur inscrit', ['user_id' => $user->id, 'role' => $user->role]);
            return response()->json([
                'message' => 'Inscription réussie',
                'user' => $user,
                'token' => $token,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l’inscription', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de l’inscription'], 500);
        }
    }

    /**
     * Déconnecte l'utilisateur et supprime le token.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();
            $user->tokens()->delete();

            Log::info('Utilisateur déconnecté', ['user_id' => $user->id]);
            return response()->json(['message' => 'Déconnexion réussie']);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la déconnexion', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la déconnexion'], 500);
        }
    }

    /**
     * Retourne les informations de l'utilisateur authentifié.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function user(Request $request)
    {
        try {
            $user = $request->user();

            // Ajouter les formations si l'utilisateur est un formateur
            if ($user->role === 'formateur') {
                $user->formations = $user->formations()->with('formateur')->get();
            }

            Log::info('Informations utilisateur récupérées', ['user_id' => $user->id]);
            return response()->json($user);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération de l’utilisateur', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur serveur'], 500);
        }
    }
}