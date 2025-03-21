import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormationService } from '../services/formation.service';
import { Formation } from '../models/formation.model';
import { Observable, of, timeout, TimeoutError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

interface PaymentCheckResponse {
  is_paid: boolean;
  message: string;
}

@Component({
  selector: 'app-formation-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-16 bg-gray-100 min-h-screen">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-6">Détail de la Formation</h2>
          
          <!-- Détails de la formation avec photo -->
          <div *ngIf="formation$ | async as formation; else loadingFormation">
            <div class="flex flex-col md:flex-row gap-6">
              <!-- Photo de la formation -->
              <div class="md:w-1/3">
                <img
                  [src]="formation.image_url ? 'http://127.0.0.1:8000/storage/' + formation.image_url : 'assets/img/vecteezy_3d-isolated-document-format-icon_11098887.png'"
                  [alt]="formation.titre"
                  class="w-full h-48 object-cover rounded-lg shadow-md bg-cover"
                />
              </div>
              <!-- Détails -->
              <div class="md:w-2/3">
                <p class="text-gray-600 mb-2">Formation ID: {{ formationId }}</p>
                <h3 class="text-2xl font-semibold text-gray-800 mb-2">{{ formation.titre }}</h3>
                <p class="text-gray-600 mb-2"><strong>Description :</strong> {{ formation.description || 'Aucune description disponible.' }}</p>
                <p class="text-gray-600 mb-2"><strong>Catégorie :</strong> {{ formation.categorie }}</p>
                <p class="text-gray-600 mb-2"><strong>Durée :</strong> {{ formation.duree }} heures</p>
                <p class="text-gray-600 mb-2"><strong>Prix :</strong> {{ formation.prix }}€</p>
              </div>
            </div>
          </div>
          <ng-template #loadingFormation>
            <div class="flex justify-center items-center py-4">
              <svg class="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="ml-2 text-gray-600">Chargement des détails de la formation...</span>
            </div>
          </ng-template>

          <!-- Gestion de l'inscription et du paiement -->
          <div class="mt-8">
            <div *ngIf="role$ | async as role; else loadingRole">
              <div *ngIf="role === 'apprenant'">
                <div *ngIf="isEnrolled$ | async as isEnrolled; else notEnrolled">
                  <div *ngIf="(isPaid$ | async)?.is_paid; else notPaid">
                    <p class="text-green-600 font-semibold mb-4">Vous êtes inscrit et le paiement est confirmé !</p>
                    <button
                      (click)="goToLecons()"
                      class="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                      aria-label="Accéder aux leçons"
                    >
                      Accéder aux leçons
                    </button>
                  </div>
                  <ng-template #notPaid>
                    <div *ngIf="isPaid$ | async as paymentStatus">
                      <p class="text-red-600 font-semibold mb-4">{{ paymentStatus.message }}</p>
                    </div>
                    <div class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50">
                      Champ de carte simulé (numéro, date, CVC)
                    </div>
                    <button
                      (click)="processPayment()"
                      class="mt-4 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                      [disabled]="isProcessingPayment"
                      aria-label="Payer maintenant"
                    >
                      <span *ngIf="isProcessingPayment">Paiement en cours... <svg class="animate-spin inline-block h-5 w-5 ml-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg></span>
                      <span *ngIf="!isProcessingPayment">Payer maintenant ({{ (formation$ | async)?.prix }}€)</span>
                    </button>
                  </ng-template>
                </div>
                <ng-template #notEnrolled>
                  <p class="text-gray-600 font-semibold mb-4">Vous n’êtes pas encore inscrit à cette formation.</p>
                  <button
                    (click)="enrollInFormation()"
                    class="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    [disabled]="isEnrolling"
                    aria-label="S’inscrire à la formation"
                  >
                    {{ isEnrolling ? 'Inscription en cours...' : 'S’inscrire à la formation' }}
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
      </div>
    </section>
  `,
  styles: []
})
export class FormationDetailComponent implements OnInit, OnDestroy {
  formationId: number;
  formation$: Observable<Formation> = of({} as Formation);
  role$: Observable<string | null> = of(null);
  isEnrolled$: Observable<boolean> = of(false);
  isPaid$: Observable<PaymentCheckResponse> = of({ is_paid: false, message: 'Initialisation' });
  isEnrolling: boolean = false;
  isProcessingPayment: boolean = false;
  private isEnrolledSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private formationService: FormationService,
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
    this.authService.refreshEnrolledFormations().subscribe();
  }

  ngOnDestroy(): void {
    this.isEnrolledSubject.complete();
  }

  private initializeObservables(): void {
    this.formation$ = this.formationService.getFormationById(this.formationId).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération de la formation:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les détails de la formation.',
          confirmButtonColor: '#1D4ED8',
        });
        return of({
          id: this.formationId,
          titre: 'Formation inconnue',
          prix: 0,
          description: '',
          duree: 0,
          image: null,
          image_url: null,
          categorie: '',
          formateur_id: 0,
          created_at: '',
          updated_at: ''
        } as Formation);
      })
    );

    this.role$ = this.authService.getUserRole().pipe(
      catchError(() => of(null))
    );

    this.isEnrolled$ = this.isEnrolledSubject.asObservable();
  }

  private refreshStates(): void {
    this.authService.isEnrolledInFormation(this.formationId).pipe(
      tap(isEnrolled => {
        console.log('isEnrolled$:', isEnrolled);
        this.isEnrolledSubject.next(isEnrolled);
      }),
      catchError(error => {
        console.error('Erreur lors de la vérification de l’inscription:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de vérifier l’état de l’inscription.',
          confirmButtonColor: '#1D4ED8',
        });
        this.isEnrolledSubject.next(false);
        return of(false);
      })
    ).subscribe();

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
  }

  enrollInFormation(): void {
    this.isEnrolling = true;
    this.cdr.detectChanges();
  
    this.authService.enrollInFormation(this.formationId).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Inscription réussie ! Veuillez procéder au paiement.',
          confirmButtonColor: '#1D4ED8',
        });

        this.authService.isEnrolledInFormation(this.formationId).pipe(
          tap(isEnrolled => {
            console.log('isEnrolled$ après inscription:', isEnrolled);
            this.isEnrolledSubject.next(isEnrolled);
            this.cdr.detectChanges();
          }),
          catchError(error => {
            console.error('Erreur lors de la vérification de l’inscription après inscription:', error);
            this.isEnrolledSubject.next(false);
            this.cdr.detectChanges();
            return of(false);
          })
        ).subscribe();
      },
      error: (error: HttpErrorResponse) => {
        const message = error.status === 400 && error.error?.message === 'Vous êtes déjà inscrit à cette formation.'
          ? 'Vous êtes déjà inscrit.'
          : 'Erreur lors de l’inscription.';
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: message,
          confirmButtonColor: '#1D4ED8',
        });
      },
      complete: () => {
        this.isEnrolling = false;
        this.cdr.detectChanges();
      }
    });
  }

  processPayment(): void {
    this.isProcessingPayment = true;
    this.cdr.detectChanges();

    console.log('Début du processus de paiement simulé...');

    this.formation$.toPromise().then(formation => {
      if (!formation) {
        console.error('Formation non disponible.');
        this.isProcessingPayment = false;
        this.cdr.detectChanges();
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Les détails de la formation ne sont pas disponibles.',
          confirmButtonColor: '#1D4ED8',
        });
        return;
      }

      const transactionId = 'simulated_txn_' + Math.random().toString(36).substring(2, 15);
      console.log('Transaction ID simulé :', transactionId);

      console.log('Envoi de la requête au backend pour le paiement...');
      this.authService.processPayment(this.formationId, formation.prix, 'carte', transactionId)
        .pipe(
          timeout(10000),
          catchError(err => {
            console.error('Erreur lors de l’appel au backend :', err);
            if (err instanceof TimeoutError) {
              return of({ error: { message: 'Le serveur met trop de temps à répondre. Veuillez réessayer plus tard.' } });
            }
            return of({ error: { message: err.message || 'Erreur inconnue lors du paiement.' } });
          })
        )
        .subscribe({
          next: (response: any) => {
            console.log('Réponse du backend :', response);
            if (response.error) {
              console.error('Erreur renvoyée par le backend :', response.error);
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: response.error.message,
                confirmButtonColor: '#1D4ED8',
              });
            } else {
              console.log('Paiement simulé réussi :', response);
              Swal.fire({
                icon: 'success',
                title: 'Succès',
                text: 'Paiement simulé effectué ! Redirection vers les leçons...',
                confirmButtonColor: '#1D4ED8',
              });
              this.refreshStates();
              this.router.navigate(['/formations', this.formationId, 'lecons']);
            }
          },
          error: (error: HttpErrorResponse) => {
            console.error('Erreur inattendue lors du paiement :', error);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: error.error?.message || 'Erreur lors du paiement : ' + error.message,
              confirmButtonColor: '#1D4ED8',
            });
          },
          complete: () => {
            console.log('Processus de paiement terminé.');
            this.isProcessingPayment = false;
            this.cdr.detectChanges();
          }
        });
    }).catch(error => {
      console.error('Erreur lors de la récupération de la formation:', error);
      this.isProcessingPayment = false;
      this.cdr.detectChanges();
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la récupération des détails de la formation.',
        confirmButtonColor: '#1D4ED8',
      });
    });
  }

  goToLecons(): void {
    this.router.navigate(['/formations', this.formationId, 'lecons']);
  }
}