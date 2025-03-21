import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question } from '../models/question.model';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('No auth token found');
    return { Authorization: `Bearer ${token}` };
  }

  getQuestionsByQuiz(quizId: number): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/quiz/${quizId}/questions`, { headers: this.getAuthHeaders() });
  }

  createQuestion(quizId: number, question: Question): Observable<Question> {
    return this.http.post<Question>(`${this.apiUrl}/quiz/${quizId}/questions`, question, { headers: this.getAuthHeaders() });
  }
}