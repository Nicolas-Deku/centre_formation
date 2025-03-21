import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Certificat } from '../models/certificat.model';

@Injectable({
  providedIn: 'root'
})
export class CertificatService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Accept': 'application/json'
    });
  }

  getCertificatsByUser(userId: number): Observable<Certificat[]> {
    return this.http.get<Certificat[]>(`${this.apiUrl}/users/${userId}/certificats`, {
      headers: this.getHeaders()
    });
  }

  downloadCertificat(certificatId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/certificats/${certificatId}/download`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }
}