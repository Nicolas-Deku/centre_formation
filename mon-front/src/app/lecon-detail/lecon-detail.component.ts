import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LeconService } from '../services/lecon.service';
import { AuthService } from '../services/auth.service';
import { Lecon } from '../models/lecon.model';
import { Observable, of, interval, Subject } from 'rxjs';
import { catchError, tap, switchMap, takeUntil } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

interface QuizState {
  quiz_started: boolean;
  remaining_time: number;
}

interface PaymentCheckResponse {
  is_paid: boolean;
  message: string;
}

@Component({
  selector: 'app-lecon-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-16 bg-gray-100 min-h-screen">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Titre de la page -->
        <div class="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Leçons de la Formation</h2>
          <p class="text-gray-600">Formation ID: {{ formationId }}</p>
        </div>

        <!-- Affichage des leçons -->
        <div class="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h3 class="text-2xl font-bold text-gray-800 mb-6">Liste des Leçons</h3>
          <div *ngIf="lecons$ | async as lecons; else loadingLecons">
            <div *ngIf="lecons.length > 0; else noLecons">
              <div *ngFor="let lecon of lecons; let i = index" class="mb-6 p-4 bg-gray-50 rounded-md shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <span class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-semibold mr-3">
                      {{ i + 1 }}
                    </span>
                    <div>
                      <h4 class="text-lg font-semibold text-gray-800">{{ lecon.titre }}</h4>
                      <p class="text-gray-600 line-clamp-2 mt-1">{{ lecon.contenu }}</p>
                      <p class="text-gray-500 text-sm mt-1">Ordre: {{ lecon.ordre }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <ng-template #noLecons>
              <p class="text-gray-600 text-center py-4">Aucune leçon disponible pour cette formation.</p>
            </ng-template>
          </div>
          <ng-template #loadingLecons>
            <div class="flex justify-center items-center py-4">
              <svg class="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="ml-2 text-gray-600">Chargement des leçons...</span>
            </div>
          </ng-template>
        </div>

        <!-- Gestion du quiz -->
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <h3 class="text-2xl font-bold text-gray-800 mb-6">Accéder au Quiz</h3>
          <div *ngIf="role$ | async as role; else loadingRole">
            <div *ngIf="role === 'apprenant'">
              <div *ngIf="isPaid$ | async as paymentStatus; else notPaid">
                <p class="text-green-600 font-semibold mb-4">Paiement confirmé ! Vous pouvez accéder au quiz.</p>
                <div *ngIf="quizState$ | async as quizState">
                  <div *ngIf="quizState.quiz_started && remainingTime > 0; else quizNotStarted">
                    <p class="text-lg text-green-600 font-semibold mb-4">
                      Le quiz est démarré ! Temps restant : {{ remainingTime }}s (Durée initiale : {{ quizDuration }} min)
                    </p>
                    <button
                      (click)="startQuiz()"
                      class="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                      [disabled]="isStartingQuiz"
                      aria-label="Accéder au quiz"
                    >
                      {{ isStartingQuiz ? 'Démarrage...' : 'Accéder au quiz' }}
                    </button>
                  </div>
                  <ng-template #quizNotStarted>
                    <p class="text-gray-600 font-semibold mb-4">Le quiz n’a pas encore été démarré par le formateur.</p>
                  </ng-template>
                </div>
              </div>
              <ng-template #notPaid>
                <p class="text-red-600 font-semibold mb-4">Vous devez payer pour accéder au quiz.</p>
                <button
                  (click)="goToPayment()"
                  class="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                  aria-label="Retourner au paiement"
                >
                  Retourner au paiement
                </button>
              </ng-template>
            </div>
          </div>
          <ng-template #loadingRole>
            <div class="flex justify-center items-center py-4">
              <svg class="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="ml-2 text-gray-600">Chargement du rôle...</span>
            </div>
          </ng-template>
        </div>
      </div>
    </section>
  `,
  styles: []
})
export class LeconDetailComponent implements OnInit, OnDestroy {
  formationId: number;
  lecons$: Observable<Lecon[]> = of([]);
  role$: Observable<string | null> = of(null);
  isPaid$: Observable<PaymentCheckResponse> = of({ is_paid: false, message: 'Initialisation' });
  quizState$: Observable<QuizState> = of({ quiz_started: false, remaining_time: 0 });
  quizDuration: number = 0;
  remainingTime: number = 0;
  isStartingQuiz: boolean = false;
  private destroy$ = new Subject<void>();
  private timerInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private leconService: LeconService,
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.formationId = +this.route.snapshot.paramMap.get('id')! || 0;
    if (!this.formationId) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'ID de formation invalide.',
        confirmButtonColor: '#1D4ED8',
      });
      this.router.navigate(['/formations']);
      return;
    }

    this.initializeObservables();
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Vous devez être connecté pour accéder à cette page.',
        confirmButtonColor: '#1D4ED8',
      });
      this.router.navigate(['/login']);
      return;
    }

    this.refreshStates();
    this.startQuizStateSync();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopTimer();
  }

  private initializeObservables(): void {
    this.role$ = this.authService.getUserRole().pipe(
      catchError(() => of(null))
    );

    this.lecons$ = this.leconService.getLeconsByFormation(this.formationId).pipe(
      tap(lecons => console.log('Leçons reçues dans le composant:', lecons)),
      catchError(error => {
        console.error('Erreur lors de la récupération des leçons:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.status === 401
            ? 'Vous devez être connecté pour accéder aux leçons.'
            : 'Impossible de charger les leçons.',
          confirmButtonColor: '#1D4ED8',
        });
        return of([]);
      })
    );

    this.isPaid$ = this.authService.isPaidForFormation(this.formationId).pipe(
      tap(paymentStatus => console.log('isPaid$:', paymentStatus)),
      catchError(error => {
        console.error('Erreur lors de la vérification du paiement:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.message || 'Impossible de vérifier l’état du paiement.',
          confirmButtonColor: '#1D4ED8',
        });
        return of({ is_paid: false, message: 'Erreur lors de la vérification du paiement' });
      })
    );

    this.quizState$ = this.authService.canStartQuizForAll(this.formationId).pipe(
      tap(quizState => console.log('quizState$:', quizState)),
      catchError(error => {
        console.error('Erreur lors de la vérification du quiz:', error);
        return of({ quiz_started: false, remaining_time: 0 });
      })
    );
  }

  private refreshStates(): void {
    this.isPaid$ = this.authService.isPaidForFormation(this.formationId).pipe(
      tap(paymentStatus => console.log('isPaid$:', paymentStatus)),
      catchError(error => {
        console.error('Erreur lors de la vérification du paiement:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.message || 'Impossible de vérifier l’état du paiement.',
          confirmButtonColor: '#1D4ED8',
        });
        return of({ is_paid: false, message: 'Erreur lors de la vérification du paiement' });
      })
    );

    this.quizState$ = this.authService.canStartQuizForAll(this.formationId).pipe(
      tap(quizState => console.log('quizState$:', quizState)),
      catchError(error => {
        console.error('Erreur lors de la vérification du quiz:', error);
        return of({ quiz_started: false, remaining_time: 0 });
      })
    );
  }

  private startQuizStateSync(): void {
    interval(5000).pipe(
      switchMap(() => this.authService.canStartQuizForAll(this.formationId)),
      takeUntil(this.destroy$),
      tap(quizState => {
        this.quizDuration = quizState.remaining_time > 0 ? Math.ceil(quizState.remaining_time / 60) : this.quizDuration;
        this.remainingTime = Math.max(0, quizState.remaining_time);
        if (quizState.quiz_started && this.remainingTime > 0 && !this.timerInterval) {
          this.startTimer();
        } else if (this.remainingTime <= 0 && this.timerInterval) {
          this.stopTimer();
        }
      }),
      catchError(error => {
        console.error('Erreur lors de la synchronisation du quiz:', error);
        return of({ quiz_started: false, remaining_time: 0 });
      })
    ).subscribe();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--;
      } else {
        this.stopTimer();
        this.quizState$ = this.authService.canStartQuizForAll(this.formationId);
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  startQuiz(): void {
    this.isStartingQuiz = true;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    this.http.post(`${environment.apiUrl}/formations/${this.formationId}/start-user-quiz`, {}, { headers }).pipe(
      tap(() => this.router.navigate(['/formations', this.formationId, 'quiz'])),
      catchError((error: HttpErrorResponse) => {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.error?.message || 'Erreur lors du démarrage du quiz.',
          confirmButtonColor: '#1D4ED8',
        });
        return of(null);
      })
    ).subscribe(() => this.isStartingQuiz = false);
  }

  goToPayment(): void {
    this.router.navigate(['/formations', this.formationId]);
  }
}