import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PaymentCheckResponse } from '../models/types';

interface User {
  id: number;
  name: string | null;
  email: string | null;
  role: 'admin' | 'formateur' | 'apprenant' | null;
}

interface EnrolledFormation {
  id: number;
  titre: string;
  description: string;
  categorie: string;
  duree: number;
  prix: number;
  image: string | null;
  status: string;
  isPaid: boolean;
  quiz_demarre?: boolean;
  image_url?: string | null;
}

interface CreatedFormation {
  id: number;
  titre: string;
  description: string;
  categorie: string;
  duree: number;
  prix: number;
  image_url: string | null;
}

interface QuizState {
  quiz_started: boolean;
  remaining_time: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private userSubject = new BehaviorSubject<User>({ id: 0, name: null, email: null, role: null });
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private enrolledFormationsSubject = new BehaviorSubject<EnrolledFormation[]>([]);
  private createdFormationsSubject = new BehaviorSubject<CreatedFormation[]>([]);
  private paymentUpdatedSource = new BehaviorSubject<void>(undefined);
  public paymentUpdated$ = this.paymentUpdatedSource.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.initializeAuthState().subscribe({
        next: () => {
          this.isLoggedInSubject.next(true);
          this.refreshEnrolledFormations().subscribe();
       
        },
        error: (error) => {
          console.error('Erreur lors de l’initialisation de l’état d’authentification:', error);
          this.clearAuthData();
        },
      });
    }
  }

  private initializeAuthState(): Observable<void> {
    return this.fetchUser().pipe(
      switchMap((user) => {
        if (user) {
          this.userSubject.next(user);
          return of(void 0);
        } else {
          this.clearAuthData();
          return throwError(() => new Error('Données utilisateur invalides'));
        }
      })
    );
  }

  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    this.userSubject.next({ id: 0, name: null, email: null, role: null });
    this.isLoggedInSubject.next(false);
    this.enrolledFormationsSubject.next([]);
    this.createdFormationsSubject.next([]);
  }

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<{ token: string; user: User; formations?: CreatedFormation[] }>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response) => {
        localStorage.setItem('auth_token', response.token);
        this.userSubject.next(response.user);
        this.isLoggedInSubject.next(true);
        if (response.user.role === 'formateur' && response.formations) {
          this.createdFormationsSubject.next(response.formations);
        }
        this.refreshEnrolledFormations().subscribe();
      }),
      map((response) => !!response.token),
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur de connexion:', error);
        return of(false);
      })
    );
  }

  register(name: string, email: string, password: string, role: 'apprenant' | 'formateur'): Observable<boolean> {
    return this.http
      .post<{ token: string; user: User }>(`${this.apiUrl}/register`, { name, email, password, password_confirmation: password, role })
      .pipe(
        tap((response) => {
          localStorage.setItem('auth_token', response.token);
          this.userSubject.next(response.user);
          this.isLoggedInSubject.next(true);
          this.enrolledFormationsSubject.next([]);
          this.createdFormationsSubject.next([]);
        }),
        map((response) => !!response.token),
        catchError((error: HttpErrorResponse) => {
          console.error('Erreur d’inscription:', error);
          return of(false);
        })
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/logout`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } })
      .pipe(
        tap(() => this.clearAuthData()),
        catchError((error: HttpErrorResponse) => {
          console.error('Erreur de déconnexion:', error);
          this.clearAuthData();
          return of(void 0);
        })
      );
  }

  fetchUser(): Observable<User | null> {
    return this.http
      .get<User>(`${this.apiUrl}/user`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } })
      .pipe(
        tap((user) => this.userSubject.next(user)),
        catchError((error: HttpErrorResponse) => {
          console.error('Erreur lors de la récupération de l’utilisateur:', error);
          this.clearAuthData();
          return of(null);
        })
      );
  }


  refreshEnrolledFormations(): Observable<EnrolledFormation[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/inscriptions`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } })
      .pipe(
        tap((response) => {
          console.log('Réponse de /inscriptions:', response);
        }),
        map((inscriptions) =>
          inscriptions.map((inscription) => ({
            id: inscription.formation.id, // Utiliser l'ID de la formation
            titre: inscription.formation.titre,
            description: inscription.formation.description,
            categorie: inscription.formation.categorie,
            duree: inscription.formation.duree,
            prix: inscription.formation.prix,
            image: inscription.formation.image,
            status: inscription.statut || 'Inscrit',
            isPaid: inscription.is_paid || false,
            quiz_demarre: inscription.quiz_demarre ?? false,
            image_url: inscription.formation.image_url || inscription.formation.image,
          }))
        ),
        tap((formations) => {
          console.log('Formations inscrites après transformation:', formations);
          this.enrolledFormationsSubject.next(formations);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Erreur lors de la récupération des formations inscrites:', error);
          return of([]);
        })
      );
  }
  enrollInFormation(formationId: number): Observable<EnrolledFormation> {
    return this.http
      .post<any>(`${this.apiUrl}/inscriptions`, { formation_id: formationId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      })
      .pipe(
        map((response) => ({
          id: response.formation.id, // Utiliser l'ID de la formation
          titre: response.formation.titre,
          description: response.formation.description,
          categorie: response.formation.categorie,
          duree: response.formation.duree,
          prix: response.formation.prix,
          image: response.formation.image,
          status: response.statut || 'Inscrit',
          isPaid: response.is_paid || false,
          quiz_demarre: response.quiz_demarre ?? false,
          image_url: response.formation.image_url || response.formation.image,
        })),
        tap((response) => {
          console.log('Formation inscrite:', response);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Erreur lors de l’inscription à la formation:', error);
          return throwError(() => error);
        })
      );
  }

  processPayment(formationId: number, montant: number, methode: string, transactionId: string): Observable<EnrolledFormation> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });

    const body = {
      formation_id: formationId,
      montant,
      methode,
      transaction_id: transactionId,
      statut: 'effectué',
    };

    return this.http.post<any>(`${this.apiUrl}/paiements`, body, { headers }).pipe(
      map((response) => ({
        id: response.id,
        titre: response.titre,
        description: response.description,
        categorie: response.categorie,
        duree: response.duree,
        prix: response.prix,
        image: response.image,
        status: 'Payé',
        isPaid: true,
        quiz_demarre: response.quiz_demarre ?? false,
        image_url: response.image_url || response.image,
      })),
      tap((response) => {
        const currentFormations = this.enrolledFormationsSubject.value;
        const updatedFormations = currentFormations.map((f) =>
          f.id === formationId ? { ...f, isPaid: true, status: 'Payé' } : f
        );
        this.enrolledFormationsSubject.next(updatedFormations);
        this.paymentUpdatedSource.next();
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur lors du paiement:', error);
        return throwError(() => error);
      })
    );
  }

  canStartQuizForAll(formationId: number): Observable<QuizState> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
    return this.http
      .get<QuizState>(`${environment.apiUrl}/formations/${formationId}/can-start-quiz`, { headers })
      .pipe(
        catchError((error) => {
          console.error('Erreur lors de la vérification de l’état du quiz:', error);
          return of({ quiz_started: false, remaining_time: 0 });
        })
      );
  }

  isEnrolledInFormation(formationId: number): Observable<boolean> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      Accept: 'application/json',
    });
  
    return this.http.get<{ is_enrolled: boolean }>(`${this.apiUrl}/inscriptions/check/${formationId}`, { headers }).pipe(
      map((response) => response.is_enrolled),
      tap((isEnrolled) => console.log(`isEnrolledInFormation(${formationId}):`, isEnrolled)),
      catchError((error) => {
        console.error('Erreur lors de la vérification de l’inscription:', error);
        return of(false);
      })
    );
  }

  isPaidForFormation(formationId: number): Observable<PaymentCheckResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      Accept: 'application/json',
    });

    return this.http.get<PaymentCheckResponse>(`${environment.apiUrl}/paiements/check/${formationId}`, { headers }).pipe(
      tap((response) => console.log('Réponse de /paiements/check:', response)),
      catchError((error) => {
        console.error('Erreur lors de la vérification du paiement:', error);
        if (error.status === 401) {
          throw new Error('Utilisateur non authentifié. Veuillez vous reconnecter.');
        } else if (error.status === 403) {
          throw new Error('Accès non autorisé. Vérifiez vos permissions.');
        } else if (error.status === 404) {
          throw new Error('Formation non trouvée.');
        } else {
          throw new Error('Erreur lors de la vérification du paiement. Veuillez réessayer plus tard.');
        }
      })
    );
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  getUser(): Observable<User> {
    return this.userSubject.asObservable();
  }

  getIsLoggedIn(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  getEnrolledFormations(): Observable<EnrolledFormation[]> {
    return this.enrolledFormationsSubject.asObservable();
  }

  getCreatedFormations(): Observable<CreatedFormation[]> {
    return this.createdFormationsSubject.asObservable();
  }

  getUserId(): Observable<number> {
    return this.userSubject.pipe(map((user) => user.id));
  }

  getUserRole(): Observable<string | null> {
    return this.userSubject.pipe(map((user) => user.role));
  }

  getUserName(): Observable<string | null> {
    return this.userSubject.pipe(map((user) => user.name));
  }

  getEmail(): Observable<string | null> {
    return this.userSubject.pipe(map((user) => user.email));
  }

  updateUser(data: { name: string; email: string; password?: string }): Observable<User> {
    return this.http
      .put<User>(`${this.apiUrl}/user`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      })
      .pipe(
        tap((updatedUser: User) => {
          this.userSubject.next(updatedUser);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Erreur lors de la mise à jour de l’utilisateur:', error);
          return throwError(() => error);
        })
      );
  }

  getFormationsByFormateur(userId: number): Observable<CreatedFormation[]> {
    return this.getCreatedFormations();
  }
}