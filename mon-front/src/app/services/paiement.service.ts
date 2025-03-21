import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paiement } from '../models/paiement.model';
import { AuthService } from './auth.service'; // Import AuthService

@Injectable({
  providedIn: 'root'
})
export class PaiementService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService // Inject AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Accept': 'application/json'
    });
  }

  getPaiementsByUser(userId: number): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.apiUrl}/users/${userId}/paiements`, {
      headers: this.getHeaders()
    });
  }

  createPaiement(paiement: Partial<Paiement>): Observable<Paiement> {
    return this.http.post<Paiement>(`${this.apiUrl}/paiements`, paiement, {
      headers: this.getHeaders()
    });
  }
}