import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizService } from '../services/quiz.service';
import { AuthService } from '../services/auth.service';
import { FormationService } from '../services/formation.service';
import { Quiz } from '../models/quiz.model';
import { Formation } from '../models/formation.model';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators'; // Add 'map'
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { PaymentCheckResponse } from '../models/types'; // Ensure this is imported

interface Question {
  id: number;
  question: string;
  type: 'choix_multiple' | 'vrai_faux' | 'texte';
  reponses?: { id: number; reponse: string; est_correcte: boolean }[];
  reponse_correcte?: string;
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="quiz_section py-20 bg-gray-100 min-h-screen">
      <div class="container mx-auto px-6">
        <!-- Détail de la Formation -->
        <div class="bg-white p-8 rounded-lg shadow-md mb-12">
          <h2 class="text-3xl font-bold mb-4" style="font-family: 'Lato', sans-serif;">Quiz pour la Formation</h2>
          <p class="text-gray-600">Formation ID: {{ formationId }}</p>
          <div *ngIf="formation$ | async as formation; else loadingFormation">
            <p><strong>Titre :</strong> {{ formation.titre }}</p>
          </div>
          <ng-template #loadingFormation>
            <p class="text-gray-600">Chargement des détails de la formation...</p>
          </ng-template>
        </div>

        <!-- Affichage des erreurs -->
        <div *ngIf="errorMessage" class="bg-red-100 p-4 rounded-lg shadow-md mb-8 text-red-700">
          {{ errorMessage }}
        </div>

        <!-- Section du quiz -->
        <div *ngIf="role$ | async as role; else loadingRole">
          <div class="bg-white p-8 rounded-lg shadow-md">
            <div *ngIf="quiz$ | async as quiz; else loadingQuiz">
              <div *ngIf="quiz.length > 0; else noQuiz">
                <h3 class="text-2xl font-bold mb-4" style="font-family: 'Lato', sans-serif;">{{ quiz[0].titre }}</h3>
                <form #quizForm="ngForm" (ngSubmit)="submitAnswers()" class="space-y-6">
                  <div *ngFor="let question of questions; let i = index" class="p-4 border-b last:border-b-0">
                    <p class="font-semibold text-gray-800">{{ question.question }}</p>
                    <div [ngSwitch]="question.type">
                      <div *ngSwitchCase="'choix_multiple'" class="space-y-2 mt-2">
                        <div *ngFor="let reponse of question.reponses">
                          <label class="flex items-center space-x-2">
                            <input
                              type="radio"
                              [name]="'question_' + question.id"
                              [value]="reponse.id"
                              [(ngModel)]="answers[i].reponse_id"
                              required
                              class="h-4 w-4 text-blue-600"
                            />
                            <span>{{ reponse.reponse }}</span>
                          </label>
                        </div>
                      </div>
                      <div *ngSwitchCase="'vrai_faux'" class="flex space-x-4 mt-2">
                        <label class="flex items-center space-x-2">
                          <input
                            type="radio"
                            [name]="'question_' + question.id"
                            [value]="true"
                            [(ngModel)]="answers[i].reponse_vrai_faux"
                            required
                            class="h-4 w-4 text-blue-600"
                          />
                          <span>Vrai</span>
                        </label>
                        <label class="flex items-center space-x-2">
                          <input
                            type="radio"
                            [name]="'question_' + question.id"
                            [value]="false"
                            [(ngModel)]="answers[i].reponse_vrai_faux"
                            required
                            class="h-4 w-4 text-blue-600"
                          />
                          <span>Faux</span>
                        </label>
                      </div>
                      <div *ngSwitchCase="'texte'" class="mt-2">
                        <input
                          type="text"
                          [(ngModel)]="answers[i].reponse_texte"
                          [name]="'question_' + question.id"
                          required
                          class="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    [disabled]="quizForm.invalid || questions.length === 0 || isSubmitting"
                    class="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-all duration-300 disabled:bg-gray-400"
                  >
                    {{ isSubmitting ? 'Soumission en cours...' : 'Soumettre le quiz' }}
                  </button>
                </form>
              </div>
              <ng-template #noQuiz>
                <p class="text-gray-600">Aucun quiz disponible pour cette formation.</p>
              </ng-template>
            </div>
            <ng-template #loadingQuiz>
              <p class="text-gray-600">Chargement des quiz...</p>
            </ng-template>
          </div>

          <!-- Message pour les apprenants non inscrits ou non payés -->
          <div
            class="bg-white p-8 rounded-lg shadow-md mt-4"
            [class.hidden]="!(role === 'apprenant' && (!(isEnrolled$ | async) || !(isPaid$ | async)))"
          >
            <p class="text-gray-600">Vous devez vous inscrire et payer pour accéder aux quiz de cette formation.</p>
          </div>
        </div>
        <ng-template #loadingRole>
          <p class="text-gray-600">Chargement du rôle...</p>
        </ng-template>
      </div>
    </section>
  `,
  styles: [
    `
      .quiz_section input[type="radio"] {
        accent-color: #2563eb;
      }
      .space-y-6 > * + * {
        margin-top: 1.5rem;
      }
    `
  ]
})
export class QuizComponent implements OnInit {
  formationId: number;
  quiz$: Observable<Quiz[]> = of([]);
  formation$: Observable<Formation> = of({} as Formation);
  role$: Observable<string | null> = of(null);
  isEnrolled$: Observable<boolean> = of(false);
  isPaid$: Observable<boolean> = of(false);
  questions: Question[] = [];
  answers: {
    question_id: number;
    reponse_id?: number;
    reponse_vrai_faux?: boolean;
    reponse_texte?: string;
  }[] = [];
  quizId: number | null = null;
  errorMessage: string | null = null;
  isSubmitting: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService,
    private authService: AuthService,
    private formationService: FormationService
  ) {
    this.formationId = +this.route.snapshot.paramMap.get('id')! || 0;
    if (!this.formationId) {
      this.errorMessage = 'ID de formation invalide.';
      Swal.fire({ icon: 'error', title: 'Erreur', text: this.errorMessage, confirmButtonColor: '#3085d6' });
      this.router.navigate(['/formations']);
      return;
    }

    this.initializeObservables();
  }

  ngOnInit(): void {}

  private initializeObservables(): void {
    this.role$ = this.authService.getUserRole().pipe(
      catchError(() => {
        console.error('Erreur lors de la récupération du rôle');
        return of(null);
      })
    );

    this.isEnrolled$ = this.authService.isEnrolledInFormation(this.formationId).pipe(
      catchError(() => {
        console.error('Erreur lors de la vérification de l’inscription');
        return of(false);
      })
    );

    this.isPaid$ = this.authService.isPaidForFormation(this.formationId).pipe(
      map((response: PaymentCheckResponse) => response.is_paid), // Map to boolean
      catchError(() => {
        console.error('Erreur lors de la vérification du paiement');
        return of(false);
      })
    );

    this.formation$ = this.formationService.getFormationById(this.formationId).pipe(
      catchError(() => {
        console.error('Erreur lors de la récupération de la formation');
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

    this.quiz$ = this.quizService.getQuizByFormation(this.formationId).pipe(
      tap(quiz => {
        if (quiz.length > 0) {
          this.quizId = quiz[0].id;
          this.loadQuestions(quiz[0].id);
        } else {
          this.errorMessage = 'Aucun quiz disponible pour cette formation.';
        }
      }),
      catchError(() => {
        console.error('Erreur lors de la récupération des quiz');
        return of([]);
      })
    );
  }

  private loadQuestions(quizId: number): void {
    this.quizService.getQuestionsByQuiz(quizId).subscribe({
      next: (questions) => {
        this.questions = questions;
        this.initializeAnswers();
        if (questions.length === 0) {
          this.errorMessage = 'Aucune question disponible pour ce quiz.';
        }
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des questions.';
      }
    });
  }

  private initializeAnswers(): void {
    this.answers = this.questions.map(q => ({
      question_id: q.id,
      reponse_id: undefined,
      reponse_vrai_faux: undefined,
      reponse_texte: undefined
    }));
  }

  submitAnswers(): void {
    if (!this.quizId) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Aucun quiz sélectionné.', confirmButtonColor: '#3085d6' });
      return;
    }

    this.isSubmitting = true;
    const formattedAnswers = this.answers.map(answer => {
      const question = this.questions.find(q => q.id === answer.question_id);
      if (!question) return null;

      const result: any = { question_id: answer.question_id };
      if (question.type === 'choix_multiple' && answer.reponse_id !== undefined) {
        result.reponse_id = answer.reponse_id;
      } else if (question.type === 'vrai_faux' && answer.reponse_vrai_faux !== undefined) {
        result.reponse_vrai_faux = answer.reponse_vrai_faux;
      } else if (question.type === 'texte' && answer.reponse_texte) {
        result.reponse_texte = answer.reponse_texte;
      } else {
        return null;
      }
      return result;
    }).filter(answer => answer !== null);

    if (formattedAnswers.length === 0) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Aucune réponse valide à soumettre.', confirmButtonColor: '#3085d6' });
      this.isSubmitting = false;
      return;
    }

    this.quizService.submitQuiz(this.quizId, formattedAnswers).pipe(
      tap(response => {
        const score = response.score ?? 'En attente';
        const hasPassed = response.hasPassedQuiz ? 'Réussi' : 'Non réussi';
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: `Quiz soumis avec succès ! Score : ${score}, Statut : ${hasPassed}`,
          confirmButtonColor: '#3085d6',
        });
        this.router.navigate(['/formations', this.formationId]);
      }),
      catchError((error: HttpErrorResponse) => {
        const message = error.error?.message || 'Erreur lors de la soumission du quiz.';
        Swal.fire({ icon: 'error', title: 'Erreur', text: message, confirmButtonColor: '#3085d6' });
        return of(null);
      })
    ).subscribe(() => this.isSubmitting = false);
  }
}