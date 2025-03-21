import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Formation } from '../models/formation.model';

interface CreatedFormation {
  id: number;
  titre: string;
  description: string;
  categorie: string;
  duree: number;
  prix: number;
  image_url: string | null;
}
@Injectable({
  providedIn: 'root',
})
export class FormationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getFormations(): Observable<Formation[]> {
    return this.http.get<Formation[]>(`${this.apiUrl}/formations`).pipe(
      tap((data) => console.log('Formations récupérées:', data)),
      catchError((error) => {
        console.error('Erreur lors de la récupération des formations:', error);
        return of([]);
      })
    );
  }

  getFormationById(formationId: number): Observable<Formation> {
    return this.http.get<Formation>(`${this.apiUrl}/formations/${formationId}`).pipe(
      tap((data) => console.log('Formation récupérée:', data)),
      catchError((error) => {
        console.error('Erroir lors de la récupération de la formation:', error);
        return of({
          id: formationId,
          titre: 'Formation inconnue',
          description: 'Aucune description disponible',
          categorie: 'Non défini',
          duree: 0,
          prix: 0,
          image: null,
          formateur_id: 0,
          created_at: '',
          updated_at: '',
          image_url: null,
        } as Formation);
      })
    );
  }

  createFormation(formation: Partial<CreatedFormation>): Observable<CreatedFormation> {
    return this.http
      .post<CreatedFormation>(`${this.apiUrl}/formations`, formation, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      })
      .pipe(
        tap((data) => console.log('Formation créée:', data)),
        catchError((error: HttpErrorResponse) => {
          console.error('Erreur lors de la création de la formation:', error);
          return throwError(() => error);
        })
      );
  }

  updateFormation(formationId: number, formation: Partial<Formation>): Observable<Formation> {
    return this.http
      .put<Formation>(`${this.apiUrl}/formations/${formationId}`, formation, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      })
      .pipe(
        tap((data) => console.log('Formation mise à jour:', data)),
        catchError((error) => {
          console.error('Erreur lors de la mise à jour de la formation:', error);
          return throwError(() => error);
        })
      );
  }

  deleteFormation(formationId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/formations/${formationId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      })
      .pipe(
        tap(() => console.log('Formation supprimée:', formationId)),
        catchError((error) => {
          console.error('Erreur lors de la suppression de la formation:', error);
          return throwError(() => error);
        })
      );
  }
}