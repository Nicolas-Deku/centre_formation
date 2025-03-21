import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Quiz } from '../models/quiz.model';
import { environment } from '../../environments/environment'; // Utilisation de l'environnement pour l'URL de l'API

interface Question {
  id: number;
  question: string;
  type: 'choix_multiple' | 'vrai_faux' | 'texte';
  reponses?: { id: number; reponse: string; est_correcte: boolean }[];
  reponse_correcte?: string;
}

interface SubmitQuizResponse {
  score?: number;
  hasPassedQuiz?: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private apiUrl = environment.apiUrl || 'http://127.0.0.1:8000/api'; // Utilisation de environment.apiUrl avec fallback

  constructor(private http: HttpClient) {}

  /**
   * Retourne les en-têtes d'authentification avec le token Bearer.
   * Si aucun token n'est trouvé, renvoie des en-têtes vides au lieu de lancer une erreur.
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
  }
// Méthode ajoutée pour récupérer les réponses d’un quiz
getQuizResponses(quizId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/quiz/${quizId}/reponses`, { headers: this.getAuthHeaders() }).pipe(
    catchError(error => {
      console.error('Erreur lors de la récupération des réponses:', error);
      return throwError(() => new Error('Impossible de récupérer les réponses du quiz.'));
    })
  );
}
  /**
   * Récupère la liste des quiz pour une formation donnée.
   * @param formationId ID de la formation
   */
  getQuizByFormation(formationId: number): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(`${this.apiUrl}/formations/${formationId}/quiz`, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des quiz:', error);
        return throwError(() => new Error('Impossible de récupérer les quiz pour cette formation.'));
      })
    );
  }

  /**
   * Crée un nouveau quiz pour une formation donnée.
   * @param formationId ID de la formation
   * @param quiz Données du quiz à créer
   */
  createQuiz(formationId: number, quiz: Quiz): Observable<Quiz> {
    return this.http.post<Quiz>(`${this.apiUrl}/formations/${formationId}/quiz`, quiz, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Erreur lors de la création du quiz:', error);
        return throwError(() => new Error('Impossible de créer le quiz.'));
      })
    );
  }

  /**
   * Récupère les questions d'un quiz spécifique.
   * @param quizId ID du quiz
   */
  getQuestionsByQuiz(quizId: number): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/quiz/${quizId}/questions`, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des questions:', error);
        return throwError(() => new Error('Impossible de récupérer les questions du quiz.'));
      })
    );
  }

  /**
   * Soumet les réponses d'un quiz pour évaluation.
   * @param quizId ID du quiz
   * @param answers Réponses formatées à soumettre
   */
  submitQuiz(quizId: number, answers: any[]): Observable<SubmitQuizResponse> {
    return this.http.post<SubmitQuizResponse>(`${this.apiUrl}/quiz/${quizId}/submit`, { answers }, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Erreur lors de la soumission du quiz:', error);
        return throwError(() => new Error(error.error?.message || 'Erreur lors de la soumission du quiz.'));
      })
    );
  }
}