<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmailIsVerified
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Vérifie si l'utilisateur est authentifié
        if (! $request->user()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Vérifie si l'utilisateur doit vérifier son email et s'il l'a fait
        if ($request->user() instanceof MustVerifyEmail &&
            ! $request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Your email address is not verified.'], 409);
        }

        // Passe à la prochaine étape de la requête
        return $next($request);
    }
}