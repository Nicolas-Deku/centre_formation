import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reponse } from '../models/reponse.model';

@Injectable({
  providedIn: 'root'
})
export class ReponseService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('No auth token found');
    return { Authorization: `Bearer ${token}` };
  }

  getReponsesByQuiz(quizId: number): Observable<Reponse[]> {
    return this.http.get<Reponse[]>(`${this.apiUrl}/quiz/${quizId}/reponses`, { headers: this.getAuthHeaders() });
  }

  createReponse(questionId: number, reponse: Reponse): Observable<Reponse> {
    return this.http.post<Reponse>(`${this.apiUrl}/questions/${questionId}/reponses`, reponse, { headers: this.getAuthHeaders() });
  }
}