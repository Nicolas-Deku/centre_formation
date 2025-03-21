import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators'; // Ajout de map
import { Lecon } from '../models/lecon.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class LeconService {
  private apiUrl = 'http://localhost:8000/api'; // Remplace par l'URL de ton backend Laravel

  constructor(private http: HttpClient, private authService: AuthService) {}

  getLeconsByFormation(formationId: number): Observable<Lecon[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      'Accept': 'application/json'
    });

    return this.http.get<{ success: boolean, lecons: Lecon[] }>(
      `${this.apiUrl}/formations/${formationId}/lecons`,
      { headers }
    ).pipe(
      tap(response => console.log('Réponse brute de l\'API pour les leçons:', response)), // Log de la réponse brute
      map(response => response.lecons || []), // Extraire le tableau "lecons", renvoyer [] si undefined
      tap(lecons => console.log('Tableau des leçons après extraction:', lecons)), // Log du tableau extrait
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur lors de la récupération des leçons:', error);
        // Renvoyer un tableau vide en cas d'erreur pour éviter de casser le composant
        return of([]);
      })
    );
  }

  getLecon(id: number): Observable<Lecon> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.get<Lecon>(`${this.apiUrl}/lecons/${id}`, { headers }).pipe(
      tap(lecon => console.log('Leçon récupérée:', lecon)),
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur lors de la récupération de la leçon:', error);
        return throwError(() => new Error(`Erreur HTTP: ${error.status} - ${error.message}`));
      })
    );
  }

  addLecon(formationId: number, leconData: { titre: string; contenu: string; ordre: number }): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/formations/${formationId}/lecons`, leconData, { headers }).pipe(
      tap(response => console.log('Leçon ajoutée:', response)),
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur lors de l\'ajout de la leçon:', error);
        return throwError(() => new Error(`Erreur HTTP: ${error.status} - ${error.message}`));
      })
    );
  }
}