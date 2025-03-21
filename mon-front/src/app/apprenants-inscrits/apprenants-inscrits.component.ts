import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject, interval, Subject, TimeoutError, throwError } from 'rxjs';
import { catchError, tap, switchMap, takeUntil, timeout, map, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

interface Apprenant {
  id: number;
  user: { id: number; name: string; email: string } | null;
  formation: { id: number; titre: string } | null;
  statut: string;
  isPaid: boolean;
  hasPassedQuiz?: boolean;
  score?: number;
  isActiveInQuiz?: boolean;
  certified?: boolean;
}

@Component({
  selector: 'app-apprenants-inscrits',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="apprenants-section py-20 bg-gradient-to-r from-gray-100 to-gray-200 min-h-screen">
      <div class="container mx-auto px-6">
        <h2 class="text-4xl font-bold mb-10 text-center text-gray-800" style="font-family: 'Lato', sans-serif;">Apprenants Inscrits</h2>

        <!-- Bouton pour démarrer ou afficher le chrono (visible uniquement pour le formateur) -->
        <div *ngIf="role$ | async as role" class="mb-6">
          <div class="flex justify-end items-center space-x-4">
            <button
              *ngIf="role !== 'apprenant'"
              (click)="startQuizWithDuration()"
              class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md disabled:opacity-50"
              [disabled]="isLoading || !(canStartQuiz$ | async)"
            >
              <span *ngIf="!isLoading && !isQuizRunning">Démarrer le quiz</span>
              <span *ngIf="isLoading" class="animate-pulse">Chargement...</span>
              <span *ngIf="isQuizRunning">Temps restant : {{ remainingTime }}s</span>
            </button>
            <p *ngIf="isQuizRunning" class="text-green-600 font-semibold text-lg">
              Les quiz sont démarrés (Durée initiale : {{ quizDuration }} min)
            </p>
          </div>
        </div>

        <!-- Liste des apprenants -->
        <div *ngIf="!isLoadingApprenants; else loading" class="bg-white p-6 rounded-lg shadow-lg">
          <div *ngIf="apprenants$ | async as apprenants; else noApprenants">
            <!-- Log temporaire pour déboguer -->
            <!-- <p class="text-gray-500 mb-4">Données brutes : {{ apprenants | json }}</p> -->
            <div *ngIf="apprenants.length > 0; else noApprenants">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-blue-100">
                    <th class="p-4 border-b-2 border-gray-300 text-gray-700">Nom</th>
                    <th class="p-4 border-b-2 border-gray-300 text-gray-700">Email</th>
                    <th class="p-4 border-b-2 border-gray-300 text-gray-700">Statut Quiz</th>
                    <th class="p-4 border-b-2 border-gray-300 text-gray-700">Points</th>
                    <th class="p-4 border-b-2 border-gray-300 text-gray-700">Certification</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let apprenant of apprenants; trackBy: trackByApprenant" class="hover:bg-gray-50 transition-colors">
                    <td class="p-4 border-b border-gray-200">{{ apprenant.user?.name ?? 'Utilisateur inconnu' }}</td>
                    <td class="p-4 border-b border-gray-200">{{ apprenant.user?.email ?? 'Email inconnu' }}</td>
                    <td class="p-4 border-b border-gray-200" [ngClass]="{
                      'text-yellow-600': apprenant.isActiveInQuiz,
                      'text-green-600': !apprenant.isActiveInQuiz && apprenant.hasPassedQuiz,
                      'text-red-600': !apprenant.isActiveInQuiz && !apprenant.hasPassedQuiz
                    }">
                      {{ apprenant.isActiveInQuiz ? 'En cours' : (apprenant.hasPassedQuiz ? 'Réussi' : 'Non réussi') }}
                    </td>
                    <td class="p-4 border-b border-gray-200">
                      {{ apprenant.score ?? 'N/A' }}
                    </td>
                    <td class="p-4 border-b border-gray-200">
                      <ng-container *ngIf="apprenant.certified; else notCertified">
                        <span class="text-green-600">Certifié</span>
                      </ng-container>
                      <ng-template #notCertified>
                        <button
                          *ngIf="apprenant.hasPassedQuiz"
                          (click)="certifyApprenant(apprenant.user?.id ?? 0)"
                          class="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-all duration-300"
                          [disabled]="!apprenant.user"
                        >
                          Certifier
                        </button>
                        <span *ngIf="!apprenant.hasPassedQuiz" class="text-gray-500">Non éligible</span>
                      </ng-template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <ng-template #noApprenants>
            <p class="text-gray-600 text-center py-4">Aucun apprenant inscrit à cette formation.</p>
          </ng-template>
        </div>
        <ng-template #loading>
          <p class="text-gray-600 text-center py-4">Chargement des apprenants...</p>
        </ng-template>
      </div>
    </section>
  `,
  styles: [
    `
      table {
        border-radius: 8px;
        overflow: hidden;
      }
      th, td {
        font-family: 'Lato', sans-serif;
      }
      .disabled\:opacity-50:disabled {
        opacity: 0.5;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApprenantsInscritsComponent implements OnInit, OnDestroy {
  formationId: number;
  apprenants$: Observable<Apprenant[]> = of([]);
  role$: Observable<string | null> = of(null);
  private canStartQuizSubject = new BehaviorSubject<boolean>(true);
  canStartQuiz$ = this.canStartQuizSubject.asObservable();
  isLoading: boolean = false;
  isLoadingApprenants: boolean = false;
  quizDuration: number = 0;
  isQuizRunning: boolean = false;
  remainingTime: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('Constructeur de ApprenantsInscritsComponent appelé');
    this.formationId = +this.route.snapshot.paramMap.get('id')! || 0;
    console.log('Formation ID:', this.formationId);

    if (!this.formationId) {
      console.error('ID de formation invalide');
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'ID de formation invalide.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    // Vérifiez si l'utilisateur est authentifié
    if (!this.authService.isAuthenticated()) {
      console.warn('Utilisateur non authentifié. Redirection vers la page de connexion.');
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Vous devez être connecté pour voir les apprenants.',
        confirmButtonColor: '#3085d6',
      }).then(() => {
        this.router.navigate(['/login']);
      });
      return;
    }

    this.role$ = this.authService.getUserRole().pipe(
      tap(role => console.log('Rôle de l\'utilisateur:', role)),
      catchError(error => {
        console.error('Erreur lors de la récupération du rôle:', error);
        return of(null);
      })
    );

    this.authService.getUser().subscribe(user => {
      console.log('Utilisateur connecté:', user);
    });

    console.log('Initialisation de apprenants$'); // Log avant l'initialisation
    this.apprenants$ = this.getApprenants().pipe(
      tap(apprenants => {
        console.log('apprenants$ a émis:', apprenants);
        this.cdr.markForCheck(); // Forcer la détection de changement
      })
    );

    // Forcer la souscription immédiate pour déboguer
    this.apprenants$.subscribe({
      next: (apprenants) => console.log('Souscription à apprenants$ réussie:', apprenants),
      error: (error) => console.error('Erreur lors de la souscription à apprenants$:', error),
      complete: () => console.log('Souscription à apprenants$ terminée')
    });

    this.initializeQuizState();
  }

  ngOnInit(): void {
    console.log('ngOnInit appelé');
    this.startPeriodicSync();
  }

  ngOnDestroy(): void {
    console.log('ngOnDestroy appelé');
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getApprenants(): Observable<Apprenant[]> {
    console.log('getApprenants appelé pour formation ID:', this.formationId);
    const headers = this.getAuthHeaders();
    this.isLoadingApprenants = true;
    this.cdr.markForCheck();

    const url = `${environment.apiUrl}/formations/${this.formationId}/apprenants`;
    console.log('Envoi de la requête HTTP vers:', url);
    return this.http.get<any[]>(url, { headers }).pipe(
      timeout(3000),
      retry({ count: 2, delay: 1000 }),
      tap(apprenants => {
        console.log('Réponse brute de l\'API pour les apprenants:', apprenants);
        this.isLoadingApprenants = false;
        this.cdr.markForCheck();
      }),
      map(apprenants => {
        const transformedApprenants = apprenants.map(apprenant => {
          console.log('Transformation de l\'apprenant:', apprenant);

          // Déterminer la valeur de user
          let user: { id: number; name: string; email: string } | null = null;
          if (apprenant.user) {
            user = apprenant.user;
          } else if (apprenant.user_id) {
            user = {
              id: apprenant.user_id,
              name: apprenant.user_name || 'Utilisateur inconnu',
              email: apprenant.user_email || 'Email inconnu'
            };
          }

          // Déterminer la valeur de formation
          let formation: { id: number; titre: string } | null = null;
          if (apprenant.formation) {
            formation = apprenant.formation;
          } else if (apprenant.formation_id) {
            formation = {
              id: apprenant.formation_id,
              titre: apprenant.formation_titre || 'Formation inconnue'
            };
          }

          return {
            id: apprenant.id,
            user: user,
            formation: formation,
            statut: apprenant.statut || 'inscrit',
            isPaid: apprenant.isPaid || false,
            hasPassedQuiz: apprenant.hasPassedQuiz || false,
            score: apprenant.score || null,
            isActiveInQuiz: apprenant.isActiveInQuiz || false,
            certified: apprenant.certified || false
          };
        });
        console.log('Apprenants après transformation:', transformedApprenants);
        return transformedApprenants;
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des apprenants:', error);
        let errorMessage = 'Erreur lors du chargement des apprenants.';
        if (error instanceof TimeoutError) {
          errorMessage = 'Le serveur met trop de temps à répondre. Veuillez vérifier que le serveur est en marche.';
        } else if (error.status === 401) {
          errorMessage = 'Utilisateur non authentifié. Veuillez vous reconnecter.';
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          errorMessage = 'Vous n’êtes pas autorisé à voir les apprenants de cette formation.';
        } else if (error.status === 404) {
          errorMessage = 'Formation non trouvée.';
        } else if (error.message?.includes('Http failure response')) {
          errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion ou l\'URL de l\'API.';
        }
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorMessage,
          confirmButtonColor: '#3085d6',
        });
        this.isLoadingApprenants = false;
        this.cdr.markForCheck();
        return of([]);
      })
    );
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    console.log('Token d\'authentification:', token);
    if (!token) {
      console.warn('Aucun token d\'authentification trouvé. Vérifiez que l\'utilisateur est connecté.');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  private initializeQuizState(): void {
    console.log('initializeQuizState appelé');
    this.authService.canStartQuizForAll(this.formationId).pipe(
      timeout(3000),
      tap(response => {
        console.log('Réponse de canStartQuizForAll:', response);
        this.isQuizRunning = response.quiz_started && response.remaining_time > 0;
        this.canStartQuizSubject.next(!this.isQuizRunning);
        this.remainingTime = Math.max(0, response.remaining_time);
        this.quizDuration = this.remainingTime > 0 ? Math.ceil(this.remainingTime / 60) : 0;
        if (this.isQuizRunning) {
          this.startTimer();
        }
        this.cdr.markForCheck();
      }),
      catchError(error => {
        console.error('Erreur lors de l’initialisation de l’état du quiz:', error);
        this.canStartQuizSubject.next(true);
        this.isQuizRunning = false;
        this.remainingTime = 0;
        this.quizDuration = 0;
        this.cdr.markForCheck();
        return of({ quiz_started: false, remaining_time: 0 });
      })
    ).subscribe();
  }

  startQuizWithDuration(): void {
    if (this.isQuizRunning) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    Swal.fire({
      title: 'Entrer la durée du quiz',
      input: 'number',
      inputLabel: 'Durée en minutes',
      inputPlaceholder: 'Ex: 30',
      showCancelButton: true,
      confirmButtonText: 'Démarrer',
      cancelButtonText: 'Annuler',
      inputValidator: (value) => !value || isNaN(Number(value)) || Number(value) <= 0 ? 'Veuillez entrer une durée valide en minutes !' : null,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const durationInMinutes = Number(result.value);
        this.quizDuration = durationInMinutes;
        this.remainingTime = durationInMinutes * 60;

        const headers = this.getAuthHeaders().set('Content-Type', 'application/json');
        this.http.post(`${environment.apiUrl}/formations/${this.formationId}/start-quiz`, { duration: durationInMinutes }, { headers }).pipe(
          timeout(3000),
          tap(() => {
            Swal.fire({
              icon: 'success',
              title: 'Succès',
              text: `Les quiz ont été démarrés pour ${durationInMinutes} minutes !`,
              confirmButtonColor: '#3085d6',
            });
            this.isQuizRunning = true;
            this.canStartQuizSubject.next(false);
            this.startTimer();
            this.apprenants$ = this.getApprenants();
            this.cdr.markForCheck();
          }),
          catchError(error => {
            this.handleError(error, 'Erreur lors du démarrage des quiz');
            this.isLoading = false;
            this.cdr.markForCheck();
            return of(null);
          })
        ).subscribe(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        });
      } else {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  certifyApprenant(apprenantId: number): void {
    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');
    this.http.post(`${environment.apiUrl}/formations/${this.formationId}/certify/${apprenantId}`, {}, { headers }).pipe(
      timeout(3000),
      tap(() => {
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'L’apprenant a été certifié avec succès !',
          confirmButtonColor: '#3085d6',
        });
        this.apprenants$ = this.getApprenants();
        this.cdr.markForCheck();
      }),
      catchError(error => {
        this.handleError(error, 'Erreur lors de la certification');
        this.cdr.markForCheck();
        return of(null);
      })
    ).subscribe();
  }

  private startTimer(): void {
    interval(1000).pipe(
      takeUntil(this.destroy$),
      tap(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--;
        } else {
          this.isQuizRunning = false;
          this.canStartQuizSubject.next(true);
          this.apprenants$ = this.getApprenants();
        }
        this.cdr.markForCheck();
      })
    ).subscribe();
  }

  private startPeriodicSync(): void {
    console.log('startPeriodicSync appelé');
    interval(10000).pipe(
      switchMap(() => this.authService.canStartQuizForAll(this.formationId).pipe(
        timeout(3000),
        tap(response => {
          console.log('Réponse périodique de canStartQuizForAll:', response);
        }),
        catchError(error => {
          console.error('Erreur lors de la synchronisation (canStartQuizForAll):', error);
          return of({ quiz_started: false, remaining_time: 0 });
        })
      )),
      takeUntil(this.destroy$),
      tap(response => {
        const wasQuizRunning = this.isQuizRunning;
        this.isQuizRunning = response.quiz_started && response.remaining_time > 0;
        this.remainingTime = Math.max(0, response.remaining_time);
        this.quizDuration = this.remainingTime > 0 ? Math.ceil(this.remainingTime / 60) : 0;
        this.canStartQuizSubject.next(!this.isQuizRunning);
        if (wasQuizRunning && !this.isQuizRunning) {
          this.apprenants$ = this.getApprenants();
        }
        this.cdr.markForCheck();
      }),
      catchError(error => {
        console.error('Erreur lors de la synchronisation:', error);
        this.isQuizRunning = false;
        this.canStartQuizSubject.next(true);
        this.apprenants$ = this.getApprenants();
        this.cdr.markForCheck();
        return of({ quiz_started: false, remaining_time: 0 });
      })
    ).subscribe();
  }

  private handleError(error: any, defaultMessage: string): Observable<any> {
    const message = error.error?.message || defaultMessage;
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message,
      confirmButtonColor: '#3085d6',
    });
    console.error(defaultMessage, error);
    return of(null);
  }

  trackByApprenant(index: number, apprenant: Apprenant): number {
    return apprenant.id;
  }
}