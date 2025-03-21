import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.authService.getIsLoggedIn().pipe(
      take(1),
      switchMap(isLoggedIn => {
        if (!isLoggedIn) {
          // Si l'utilisateur n'est pas connecté, redirige vers la page de connexion
          return [this.router.createUrlTree(['/login'])];
        }
        // Vérifie le rôle de l'utilisateur
        return this.authService.getUserRole().pipe(
          take(1),
          map(role => {
            if (role === 'formateur') {
              return true; // Autorise l'accès si l'utilisateur est un formateur
            } else {
              // Redirige vers la page d'accueil si l'utilisateur n'est pas formateur
              return this.router.createUrlTree(['/']);
            }
          })
        );
      })
    );
  }
}