import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { QuizService } from '../services/quiz.service';
import { QuestionService } from '../services/question.service';
import { ReponseService } from '../services/reponse.service';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

interface Formation {
  id: number;
  titre: string;
  description: string;
  prix: number;
  duree: number;
  image_url: string | null;
  categorie: string;
}

interface Lecon {
  id: number;
  titre: string;
  contenu: string;
  ordre: number;
}

interface Quiz {
  id: number;
  titre: string;
  ordre: number;
}

interface Question {
  id: number;
  question: string;
  type: 'choix_multiple' | 'vrai_faux' | 'texte';
  reponse_correcte?: string;
}

interface Reponse {
  id: number;
  question_id: number;
  reponse: string;
  est_correcte: boolean;
}

@Component({
  selector: 'app-manage-formations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-4xl font-extrabold text-gray-900 text-center mb-10">
          Gérer vos <span class="text-indigo-600">Formations</span>
        </h2>

        <section class="bg-white shadow-lg rounded-lg p-6 mb-10 transition-all duration-300 hover:shadow-xl">
          <h3 class="text-2xl font-semibold text-gray-800 mb-6">Ajouter une Formation</h3>
          <form (ngSubmit)="addFormation()" class="space-y-6">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700">Titre</label>
              <input id="title" type="text" [(ngModel)]="newFormation.titre" name="titre" class="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200" required />
            </div>
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
              <textarea id="description" [(ngModel)]="newFormation.description" name="description" class="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200" rows="4" required></textarea>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="duree" class="block text-sm font-medium text-gray-700">Durée (heures)</label>
                <input id="duree" type="number" [(ngModel)]="newFormation.duree" name="duree" class="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200" required />
              </div>
              <div>
                <label for="prix" class="block text-sm font-medium text-gray-700">Prix (€)</label>
                <input id="prix" type="number" [(ngModel)]="newFormation.prix" name="prix" class="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200" required />
              </div>
            </div>
            <div>
              <label for="categorie" class="block text-sm font-medium text-gray-700">Catégorie</label>
              <select id="categorie" [(ngModel)]="newFormation.categorie" name="categorie" class="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200" required>
                <option value="" disabled selected>Choisir une catégorie</option>
                <option value="programmation">Programmation</option>
                <option value="design">Design</option>
                <option value="business">Business</option>
              </select>
            </div>
            <div>
              <label for="image" class="block text-sm font-medium text-gray-700">Image</label>
              <input id="image" type="file" (change)="onFileSelected($event)" accept="image/*" class="mt-1 block w-full text-gray-700 border border-gray-300 rounded-md px-4 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all duration-200" />
              <img *ngIf="imagePreview" [src]="imagePreview" alt="Aperçu" class="mt-4 w-40 h-40 object-cover rounded-md shadow" />
            </div>
            <button type="submit" [disabled]="isLoading" class="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 disabled:bg-gray-400">
              {{ isLoading ? 'Ajout en cours...' : 'Ajouter la Formation' }}
            </button>
          </form>
        </section>

        <section class="bg-white shadow-lg rounded-lg p-6">
          <h3 class="text-2xl font-semibold text-gray-800 mb-6">Vos Formations</h3>
          <div *ngIf="isLoadingFormations" class="text-center py-4 text-gray-500 animate-pulse">
            Chargement des formations...
          </div>
          <div *ngIf="formations.length === 0 && !isLoadingFormations" class="text-center py-4 text-gray-500">
            Aucune formation disponible pour le moment.
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div *ngFor="let formation of formations" class="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300">
              <div class="flex flex-col space-y-4">
                <div>
                  <h4 class="text-lg font-semibold text-gray-900">{{ formation.titre }}</h4>
                  <p class="text-gray-600 text-sm mt-1 line-clamp-2">{{ formation.description }}</p>
                  <p class="text-gray-500 text-sm mt-1">Durée : {{ formation.duree }}h | Prix : {{ formation.prix }}€ | Catégorie : {{ formation.categorie }}</p>
                  <img [src]="formation.image_url ? 'http://127.0.0.1:8000/storage/' + formation.image_url : 'assets/img/vecteezy_3d-isolated-document-format-icon_11098887.png'" alt="Formation" class="mt-2 w-32 h-32 object-cover rounded-md shadow-sm" (error)="onImageError($event)" />
                </div>
                <div class="flex flex-col space-y-2">
                  <button (click)="selectFormation(formation)" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-all duration-300">
                    Gérer
                  </button>
                  <a [routerLink]="['/formations', formation.id, 'apprenants-inscrits']" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-center transition-all duration-300">
                    Apprenants Inscrits
                  </a>
                </div>
              </div>

              <div *ngIf="selectedFormation?.id === formation.id" class="mt-6 space-y-6">
                <div class="border-t pt-6">
                  <h5 class="text-xl font-semibold text-gray-800 mb-4">Ajouter une Leçon</h5>
                  <form (ngSubmit)="addLecon()" class="space-y-4">
                    <div>
                      <label for="leconTitre" class="block text-sm font-medium text-gray-700">Titre</label>
                      <input id="leconTitre" type="text" [(ngModel)]="newLecon.titre" name="leconTitre" class="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200" required />
                    </div>
                    <div>
                      <label for="leconContenu" class="block text-sm font-medium text-gray-700">Contenu</label>
                      <textarea id="leconContenu" [(ngModel)]="newLecon.contenu" name="leconContenu" class="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200" rows="3" required></textarea>
                    </div>
                    <div>
                      <label for="leconOrdre" class="block text-sm font-medium text-gray-700">Ordre</label>
                      <input id="leconOrdre" type="number" [(ngModel)]="newLecon.ordre" name="leconOrdre" class="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200" required />
                    </div>
                    <button type="submit" [disabled]="isLoading" class="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition-all duration-300 disabled:bg-gray-400">
                      Ajouter la Leçon
                    </button>
                  </form>
                </div>

                <div class="border-t pt-6">
                  <h5 class="text-xl font-semibold text-gray-800 mb-4">Ajouter un Quiz</h5>
                  <form (ngSubmit)="addQuiz()" class="space-y-4">
                    <div>
                      <label for="quizTitre" class="block text-sm font-medium text-gray-700">Titre</label>
                      <input id="quizTitre" type="text" [(ngModel)]="newQuiz.titre" name="quizTitre" class="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200" required />
                    </div>
                    <div>
                      <label for="quizOrdre" class="block text-sm font-medium text-gray-700">Ordre</label>
                      <input id="quizOrdre" type="number" [(ngModel)]="newQuiz.ordre" name="quizOrdre" class="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200" required />
                    </div>
                    <button type="submit" [disabled]="isLoading" class="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition-all duration-300 disabled:bg-gray-400">
                      Ajouter le Quiz
                    </button>
                  </form>
                </div>

                <div class="border-t pt-6">
                  <h5 class="text-xl font-semibold text-gray-800 mb-4">Leçons</h5>
                  <div *ngIf="lecons.length === 0" class="text-gray-500">
                    Aucune leçon pour cette formation.
                  </div>
                  <div *ngFor="let lecon of lecons" class="py-3 border-b last:border-b-0">
                    <p class="text-gray-900 font-medium">{{ lecon.titre }} <span class="text-gray-500 text-sm">(Ordre : {{ lecon.ordre }})</span></p>
                    <p class="text-gray-600 text-sm mt-1 line-clamp-3">{{ lecon.contenu }}</p>
                  </div>
                </div>

                <div class="border-t pt-6">
                  <h5 class="text-xl font-semibold text-gray-800 mb-4">Quiz</h5>
                  <div *ngIf="quizList.length === 0" class="text-gray-500">
                    Aucun quiz pour cette formation.
                  </div>
                  <div *ngFor="let quiz of quizList" class="py-3 border-b last:border-b-0">
                    <div class="flex justify-between items-center">
                      <p class="text-gray-900 font-medium">{{ quiz.titre }} <span class="text-gray-500 text-sm">(Ordre : {{ quiz.ordre }})</span></p>
                      <button (click)="selectQuiz(quiz)" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-all duration-300">
                        Gérer les Questions
                      </button>
                    </div>

                    <div *ngIf="selectedQuiz?.id === quiz.id" class="mt-4 space-y-6">
                      <div class="border-t pt-4">
                        <h6 class="text-lg font-semibold text-gray-800 mb-3">Ajouter une Question</h6>
                        <form (ngSubmit)="addQuestion()" class="space-y-4">
                          <div>
                            <label for="questionText" class="block text-sm font-medium text-gray-700">Question</label>
                            <input id="questionText" type="text" [(ngModel)]="newQuestion.question" name="questionText" class="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200" required />
                          </div>
                          <div>
                            <label for="questionType" class="block text-sm font-medium text-gray-700">Type</label>
                            <select id="questionType" [(ngModel)]="newQuestion.type" name="questionType" (change)="onQuestionTypeChange()" class="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200" required>
                              <option value="choix_multiple">Choix Multiple</option>
                              <option value="vrai_faux">Vrai/Faux</option>
                              <option value="texte">Texte</option>
                            </select>
                          </div>
                          <div *ngIf="newQuestion.type === 'vrai_faux'">
                            <label for="reponseCorrecte" class="block text-sm font-medium text-gray-700">Réponse Correcte</label>
                            <select id="reponseCorrecte" [(ngModel)]="newQuestion.reponse_correcte" name="reponseCorrecte" class="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200" required>
                              <option value="vrai">Vrai</option>
                              <option value="faux">Faux</option>
                            </select>
                          </div>
                          <button type="submit" [disabled]="isLoading" class="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition-all duration-300 disabled:bg-gray-400">
                            Ajouter la Question
                          </button>
                        </form>
                      </div>

                      <div class="border-t pt-4">
                        <h6 class="text-lg font-semibold text-gray-800 mb-3">Ajouter une Réponse</h6>
                        <form (ngSubmit)="addReponse()" class="space-y-4">
                          <div>
                            <label for="reponseQuestion" class="block text-sm font-medium text-gray-700">Question</label>
                            <select id="reponseQuestion" [(ngModel)]="newReponse.question_id" name="reponseQuestion" class="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200" required>
                              <option *ngFor="let question of questions" [value]="question.id">
                                {{ question.question }}
                              </option>
                            </select>
                          </div>
                          <div>
                            <label for="reponseText" class="block text-sm font-medium text-gray-700">Réponse</label>
                            <input id="reponseText" type="text" [(ngModel)]="newReponse.reponse" name="reponseText" class="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200" required />
                          </div>
                          <div>
                            <label for="estCorrecte" class="flex items-center text-sm font-medium text-gray-700">
                              <input id="estCorrecte" type="checkbox" [(ngModel)]="newReponse.est_correcte" name="estCorrecte" class="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                              Est Correcte ?
                            </label>
                          </div>
                          <button type="submit" [disabled]="isLoading" class="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition-all duration-300 disabled:bg-gray-400">
                            Ajouter la Réponse
                          </button>
                        </form>
                      </div>

                      <div class="border-t pt-4">
                        <h6 class="text-lg font-semibold text-gray-800 mb-3">Questions</h6>
                        <div *ngIf="questions.length === 0" class="text-gray-500">
                          Aucune question pour ce quiz.
                        </div>
                        <div *ngFor="let question of questions" class="py-3 border-b last:border-b-0">
                          <p class="text-gray-900 font-medium">{{ question.question }} <span class="text-gray-500 text-sm">(Type : {{ question.type }})</span></p>
                          <div class="ml-4 mt-1">
                            <p *ngIf="!reponses[question.id]?.length" class="text-gray-500 text-sm">
                              Aucune réponse.
                            </p>
                            <div *ngFor="let reponse of reponses[question.id] || []" class="text-gray-600 text-sm">
                              - {{ reponse.reponse }} <span class="text-indigo-600">({{ reponse.est_correcte ? 'Correcte' : 'Incorrecte' }})</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `
  ]
})
export class ManageFormationsComponent implements OnInit {
  newFormation: Formation = { id: 0, titre: '', description: '', duree: 0, prix: 0, image_url: null, categorie: '' };
  newLecon: Lecon = { id: 0, titre: '', contenu: '', ordre: 0 };
  newQuiz: Quiz = { id: 0, titre: '', ordre: 0 };
  newQuestion: Question = { id: 0, question: '', type: 'choix_multiple', reponse_correcte: undefined };
  newReponse: Reponse = { id: 0, question_id: 0, reponse: '', est_correcte: false };
  imagePreview: string | null = null;
  isLoading = false;
  isLoadingFormations = false;
  formations: Formation[] = [];
  selectedFormation: Formation | null = null;
  lecons: Lecon[] = [];
  quizList: Quiz[] = [];
  selectedQuiz: Quiz | null = null;
  questions: Question[] = [];
  reponses: { [key: number]: Reponse[] } = {};

  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient,
    private quizService: QuizService,
    private questionService: QuestionService,
    private reponseService: ReponseService
  ) {}

  ngOnInit() {
    this.loadFormations();
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('No auth token found');
    return { Authorization: `Bearer ${token}` };
  }

  loadFormations() {
    this.isLoadingFormations = true;
    this.http.get<Formation[]>(`${this.apiUrl}/formateur/formations`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(formations => this.formations = formations),
        catchError(error => this.handleError(error, 'Erreur lors du chargement des formations')),
        finalize(() => this.isLoadingFormations = false)
      ).subscribe();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.newFormation.image_url = null;
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  addFormation() {
    if (!this.validateFormation(this.newFormation)) return;

    this.isLoading = true;
    const formData = new FormData();
    formData.append('titre', this.newFormation.titre);
    formData.append('description', this.newFormation.description);
    formData.append('duree', this.newFormation.duree.toString());
    formData.append('prix', this.newFormation.prix.toString());
    formData.append('categorie', this.newFormation.categorie);
    if (this.imagePreview) {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput.files?.[0]) formData.append('image', fileInput.files[0]);
    }

    this.http.post<Formation>(`${this.apiUrl}/formations`, formData, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => {
          this.resetNewFormation();
          this.loadFormations();
          Swal.fire({ icon: 'success', title: 'Succès', text: 'Formation ajoutée !', timer: 2000, showConfirmButton: false });
        }),
        catchError(error => this.handleError(error, 'Erreur lors de l’ajout de la formation')),
        finalize(() => this.isLoading = false)
      ).subscribe();
  }

  selectFormation(formation: Formation) {
    this.selectedFormation = formation === this.selectedFormation ? null : formation;
    if (this.selectedFormation) {
      this.loadLecons(formation.id);
      this.loadQuiz(formation.id);
    } else {
      this.lecons = [];
      this.quizList = [];
      this.selectedQuiz = null;
      this.questions = [];
      this.reponses = {};
    }
  }

  loadLecons(formationId: number) {
    this.isLoading = true;
    this.http.get<Lecon[]>(`${this.apiUrl}/formations/${formationId}/lecons`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(lecons => this.lecons = lecons),
        catchError(error => this.handleError(error, 'Erreur lors du chargement des leçons')),
        finalize(() => this.isLoading = false)
      ).subscribe();
  }

  addLecon() {
    if (!this.validateLecon(this.newLecon) || !this.selectedFormation) return;

    this.isLoading = true;
    this.http.post<Lecon>(`${this.apiUrl}/formations/${this.selectedFormation.id}/lecons`, this.newLecon, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => {
          this.newLecon = { id: 0, titre: '', contenu: '', ordre: 0 };
          this.loadLecons(this.selectedFormation!.id);
          Swal.fire({ icon: 'success', title: 'Succès', text: 'Leçon ajoutée !', timer: 2000, showConfirmButton: false });
        }),
        catchError(error => this.handleError(error, 'Erreur lors de l’ajout de la leçon')),
        finalize(() => this.isLoading = false)
      ).subscribe();
  }

  loadQuiz(formationId: number) {
    this.isLoading = true;
    this.http.get<Quiz[]>(`${this.apiUrl}/formations/${formationId}/quiz`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(quizList => {
          this.quizList = quizList;
          this.selectedQuiz = null;
          this.questions = [];
          this.reponses = {};
        }),
        catchError(error => this.handleError(error, 'Erreur lors du chargement des quiz')),
        finalize(() => this.isLoading = false)
      ).subscribe();
  }

  addQuiz() {
    if (!this.validateQuiz(this.newQuiz) || !this.selectedFormation) return;

    this.isLoading = true;
    this.http.post<Quiz>(`${this.apiUrl}/formations/${this.selectedFormation.id}/quiz`, this.newQuiz, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => {
          this.newQuiz = { id: 0, titre: '', ordre: 0 };
          this.loadQuiz(this.selectedFormation!.id);
          Swal.fire({ icon: 'success', title: 'Succès', text: 'Quiz ajouté !', timer: 2000, showConfirmButton: false });
        }),
        catchError(error => this.handleError(error, 'Erreur lors de l’ajout du quiz')),
        finalize(() => this.isLoading = false)
      ).subscribe();
  }

  selectQuiz(quiz: Quiz) {
    this.selectedQuiz = quiz === this.selectedQuiz ? null : quiz;
    if (this.selectedQuiz) this.loadQuestions(quiz.id);
    else {
      this.questions = [];
      this.reponses = {};
    }
  }

  loadQuestions(quizId: number) {
    this.isLoading = true;
    this.http.get<Question[]>(`${this.apiUrl}/quiz/${quizId}/questions`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(questions => {
          this.questions = questions;
          this.loadReponses(quizId);
        }),
        catchError(error => this.handleError(error, 'Erreur lors du chargement des questions')),
        finalize(() => this.isLoading = false)
      ).subscribe();
  }

  loadReponses(quizId: number) {
    this.isLoading = true;
    this.http.get<Reponse[]>(`${this.apiUrl}/quiz/${quizId}/reponses`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(reponses => {
          this.reponses = reponses.reduce((acc, rep) => {
            acc[rep.question_id] = acc[rep.question_id] || [];
            acc[rep.question_id].push(rep);
            return acc;
          }, {} as { [key: number]: Reponse[] });
        }),
        catchError(error => this.handleError(error, 'Erreur lors du chargement des réponses')),
        finalize(() => this.isLoading = false)
      ).subscribe();
  }

  onQuestionTypeChange() {
    if (this.newQuestion.type !== 'vrai_faux') this.newQuestion.reponse_correcte = undefined;
  }

  addQuestion() {
    if (!this.validateQuestion(this.newQuestion) || !this.selectedQuiz) return;

    this.isLoading = true;
    this.http.post<Question>(`${this.apiUrl}/quiz/${this.selectedQuiz.id}/questions`, this.newQuestion, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => {
          this.newQuestion = { id: 0, question: '', type: 'choix_multiple', reponse_correcte: undefined };
          this.loadQuestions(this.selectedQuiz!.id);
          Swal.fire({ icon: 'success', title: 'Succès', text: 'Question ajoutée !', timer: 2000, showConfirmButton: false });
        }),
        catchError(error => this.handleError(error, 'Erreur lors de l’ajout de la question')),
        finalize(() => this.isLoading = false)
      ).subscribe();
  }

  addReponse() {
    if (!this.validateReponse(this.newReponse) || !this.selectedQuiz) return;

    this.isLoading = true;
    this.http.post<Reponse>(`${this.apiUrl}/reponses`, this.newReponse, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => {
          this.newReponse = { id: 0, question_id: 0, reponse: '', est_correcte: false };
          this.loadReponses(this.selectedQuiz!.id);
          Swal.fire({ icon: 'success', title: 'Succès', text: 'Réponse ajoutée !', timer: 2000, showConfirmButton: false });
        }),
        catchError(error => this.handleError(error, 'Erreur lors de l’ajout de la réponse')),
        finalize(() => this.isLoading = false)
      ).subscribe();
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/img/vecteezy_3d-isolated-document-format-icon_11098887.png';
  }

  private validateFormation(formation: Formation): boolean {
    if (!formation.titre || !formation.description || formation.duree <= 0 || formation.prix < 0 || !formation.categorie) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Veuillez remplir tous les champs correctement, y compris la catégorie.', confirmButtonColor: '#3085d6' });
      return false;
    }
    return true;
  }

  private validateLecon(lecon: Lecon): boolean {
    if (!lecon.titre || !lecon.contenu || lecon.ordre < 0) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Veuillez remplir tous les champs correctement.', confirmButtonColor: '#3085d6' });
      return false;
    }
    return true;
  }

  private validateQuiz(quiz: Quiz): boolean {
    if (!quiz.titre || quiz.ordre < 0) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Veuillez remplir tous les champs correctement.', confirmButtonColor: '#3085d6' });
      return false;
    }
    return true;
  }

  private validateQuestion(question: Question): boolean {
    if (!question.question || (question.type === 'vrai_faux' && !question.reponse_correcte)) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Veuillez remplir tous les champs correctement.', confirmButtonColor: '#3085d6' });
      return false;
    }
    return true;
  }

  private validateReponse(reponse: Reponse): boolean {
    if (!reponse.reponse || reponse.question_id <= 0) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Veuillez sélectionner une question et entrer une réponse.', confirmButtonColor: '#3085d6' });
      return false;
    }
    return true;
  }

  private handleError(error: any, defaultMessage: string): Observable<any> {
    const message = error.status === 401
      ? 'Session expirée. Veuillez vous reconnecter.'
      : error.error?.message || defaultMessage;
    const details = error.error?.errors ? Object.values(error.error.errors).join(', ') : '';
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: `${message}${details ? ` Détails : ${details}` : ''}`,
      confirmButtonColor: '#3085d6'
    });
    console.error(defaultMessage, error);
    return of(null);
  }

  private resetNewFormation() {
    this.newFormation = { id: 0, titre: '', description: '', duree: 0, prix: 0, image_url: null, categorie: '' };
    this.imagePreview = null;
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }
}