import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { AuthService } from '../services/auth.service';
import { PaiementService } from '../services/paiement.service';
import { CertificatService } from '../services/certificat.service';
import { FormationService } from '../services/formation.service';
import { Observable, of, Subject } from 'rxjs';
import { switchMap, catchError, tap, takeUntil } from 'rxjs/operators';
import { FormsModule, NgForm } from '@angular/forms';
import { Paiement } from '../models/paiement.model';
import { Certificat } from '../models/certificat.model';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

// Aligné avec AuthService
interface EnrolledFormation {
  id: number;
  titre: string;
  description: string;
  categorie: string;
  duree: number; // number au lieu de string
  prix: number;
  image: string | null;
  status: string;
  isPaid: boolean;
  quiz_demarre?: boolean; // Aligné avec AuthService
  image_url?: string | null;
}

// Aligné avec AuthService
interface CreatedFormation {
  id: number;
  titre: string;
  description: string;
  categorie: string;
  duree: number; // number au lieu de string
  prix: number;
  image_url: string | null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ModalComponent, FormsModule],
  template: `
    <section class="py-20 bg-gray-100 min-h-screen">
      <div class="container mx-auto px-6">
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold text-gray-900">
            Mon <span class="text-blue-600">Profil</span>
          </h2>
          <p class="mt-2 text-gray-600 text-lg">Gérez vos informations et vos formations.</p>
        </div>

        <!-- User Information -->
        <div class="bg-white p-8 rounded-md shadow-md mb-12">
          <h3 class="text-2xl font-bold mb-4 text-gray-800">Mes Informations</h3>
          <div *ngIf="role$ | async as role; else loadingRole">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Nom :</strong> {{ (user$ | async) || 'Utilisateur' }}</p>
                <p><strong>Email :</strong> {{ (email$ | async) || 'email@example.com' }}</p>
                <p><strong>Rôle :</strong> {{ role || 'Non défini' }}</p>
              </div>
              <div class="text-right md:text-left">
                <button (click)="openSettingsModal()" class="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" aria-label="Modifier le profil">
                  Modifier le profil
                </button>
              </div>
            </div>
          </div>
          <ng-template #loadingRole>
            <p class="text-gray-600">Chargement des informations...</p>
          </ng-template>
        </div>

        <!-- Formations Section -->
        <div *ngIf="role$ | async as role" class="bg-white p-8 rounded-md shadow-md mb-12">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-2xl font-bold text-gray-800">
              {{ role === 'formateur' ? 'Mes Formations Créées' : 'Mes Formations' }}
            </h3>
            <button *ngIf="role === 'formateur'" (click)="openAddFormationModal()" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300" aria-label="Ajouter une formation">
              Ajouter une formation
            </button>
          </div>
          <!-- Apprentice Formations -->
          <div *ngIf="role !== 'formateur'" class="mb-6">
            <div *ngIf="enrolledFormations$ | async as enrolledFormations; else loadingFormations">
              <div *ngIf="enrolledFormations.length > 0; else noFormations">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div *ngFor="let formation of enrolledFormations" class="p-4 border rounded-md shadow-sm">
                    <img [src]="formation.image || formation.image_url || 'assets/default-formation.png'" [alt]="formation.titre" class="w-full h-24 object-cover rounded-t-md mb-2">
                    <h4 class="font-semibold text-gray-800">{{ formation.titre }}</h4>
                    <p class="text-gray-600">Durée : {{ formation.duree }} heures</p>
                    <p class="text-gray-600">Prix : {{ formation.prix }}€</p>
                    <p class="text-gray-600">Statut : {{ formation.status }}</p>
                    <button (click)="viewFormationDetails(formation.id)" class="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 mt-2" aria-label="Voir les détails">
                      Voir les détails
                    </button>
                  </div>
                </div>
              </div>
              <ng-template #noFormations>
                <p class="text-gray-600">Vous n'êtes inscrit à aucune formation.</p>
              </ng-template>
            </div>
          </div>
          <!-- Formateur Formations -->
          <div *ngIf="role === 'formateur'">
            <div *ngIf="createdFormations$ | async as createdFormations; else loadingFormations">
              <div *ngIf="createdFormations.length > 0; else noFormations">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div *ngFor="let formation of createdFormations" class="p-4 border rounded-md shadow-sm">
                    <img [src]="formation.image_url || 'assets/default-formation.png'" [alt]="formation.titre" class="w-full h-24 object-cover rounded-t-md mb-2">
                    <h4 class="font-semibold text-gray-800">{{ formation.titre }}</h4>
                    <p class="text-gray-600">Durée : {{ formation.duree }} heures</p>
                    <p class="text-gray-600">Prix : {{ formation.prix }}€</p>
                    <div class="mt-2 space-x-2">
                      <button (click)="editFormation(formation.id)" class="bg-yellow-600 text-white px-3 py-1 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300" aria-label="Modifier la formation">
                        Modifier
                      </button>
                      <button (click)="deleteFormation(formation.id)" class="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300" aria-label="Supprimer la formation">
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <ng-template #noFormations>
                <p class="text-gray-600">Vous n'avez créé aucune formation.</p>
              </ng-template>
            </div>
          </div>
          <ng-template #loadingFormations>
            <p class="text-gray-600">Chargement des formations...</p>
          </ng-template>
        </div>

        <!-- Payments Section -->
        <div *ngIf="(role$ | async) !== 'formateur'" class="bg-white p-8 rounded-md shadow-md mb-12">
          <h3 class="text-2xl font-bold mb-4 text-gray-800">Mes Paiements</h3>
          <div *ngIf="paiements$ | async as paiements; else loadingPaiements">
            <div *ngIf="paiements.length > 0; else noPaiementsContent">
              <div *ngFor="let paiement of paiements" class="p-4 border-b border-gray-200 last:border-b-0">
                <p><strong>ID Formation :</strong> {{ paiement.formation_id }}</p>
                <p><strong>Montant :</strong> {{ paiement.montant }}€</p>
                <p><strong>Statut :</strong> {{ paiement.statut }}</p>
                <p><strong>Méthode :</strong> {{ paiement.methode }}</p>
                <p><strong>ID Transaction :</strong> {{ paiement.transaction_id }}</p>
              </div>
            </div>
            <ng-template #noPaiementsContent>
              <p class="text-gray-600">Aucun paiement enregistré.</p>
            </ng-template>
          </div>
          <ng-template #loadingPaiements>
            <p class="text-gray-600">Chargement des paiements...</p>
          </ng-template>
        </div>

        <!-- Certificates Section -->
        <div *ngIf="(role$ | async) !== 'formateur'" class="bg-white p-8 rounded-md shadow-md">
          <h3 class="text-2xl font-bold mb-4 text-gray-800">Mes Certificats</h3>
          <div *ngIf="certificats$ | async as certificats; else loadingCertificats">
            <div *ngIf="certificats.length > 0; else noCertificatsContent">
              <div *ngFor="let certificat of certificats" class="p-4 border-b border-gray-200 last:border-b-0">
                <p><strong>ID Formation :</strong> {{ certificat.formation_id }}</p>
                <p><strong>Date d'obtention :</strong> {{ certificat.date_obtention | date:'medium' }}</p>
                <button (click)="downloadCertificat(certificat.id)" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 mt-2" aria-label="Télécharger le certificat">
                  Télécharger
                </button>
              </div>
            </div>
            <ng-template #noCertificatsContent>
              <p class="text-gray-600">Aucun certificat obtenu.</p>
            </ng-template>
          </div>
          <ng-template #loadingCertificats>
            <p class="text-gray-600">Chargement des certificats...</p>
          </ng-template>
        </div>
      </div>

      <!-- Profile Settings Modal -->
      <app-modal [isOpen]="showSettingsModal" (closeModal)="closeSettingsModal()">
        <div class="p-6">
          <h3 class="text-2xl font-bold mb-4 text-gray-800">Paramètres du Profil</h3>
          <form class="space-y-4" (ngSubmit)="saveSettings()" #profileForm="ngForm">
            <div>
              <label for="name" class="block text-gray-700">Nom</label>
              <input
                id="name"
                type="text"
                [(ngModel)]="userName"
                name="name"
                class="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                aria-required="true"
              >
            </div>
            <div>
              <label for="email" class="block text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                [(ngModel)]="userEmail"
                name="email"
                class="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                aria-required="true"
              >
            </div>
            <div>
              <label for="password" class="block text-gray-700">Nouveau mot de passe (facultatif)</label>
              <input
                id="password"
                type="password"
                [(ngModel)]="userPassword"
                name="password"
                class="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>
            <div class="flex space-x-4">
              <button
                type="submit"
                [disabled]="profileForm.invalid"
                class="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                aria-label="Sauvegarder les modifications"
              >
                Sauvegarder
              </button>
              <button
                type="button"
                (click)="closeSettingsModal()"
                class="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300"
                aria-label="Annuler"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </app-modal>

      <!-- Add Formation Modal -->
      <app-modal [isOpen]="showAddFormationModal" (closeModal)="closeAddFormationModal()">
        <div class="p-6">
          <h3 class="text-2xl font-bold mb-4 text-gray-800">Ajouter une Formation</h3>
          <form class="space-y-4" (ngSubmit)="addFormation(addFormationForm)" #addFormationForm="ngForm">
            <div>
              <label for="titre" class="block text-gray-700">Titre</label>
              <input
                id="titre"
                type="text"
                [(ngModel)]="newFormation.titre"
                name="titre"
                class="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                aria-required="true"
              >
            </div>
            <div>
              <label for="description" class="block text-gray-700">Description</label>
              <input
                id="description"
                type="text"
                [(ngModel)]="newFormation.description"
                name="description"
                class="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                aria-required="true"
              >
            </div>
            <div>
              <label for="categorie" class="block text-gray-700">Catégorie</label>
              <input
                id="categorie"
                type="text"
                [(ngModel)]="newFormation.categorie"
                name="categorie"
                class="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                aria-required="true"
              >
            </div>
            <div>
              <label for="duree" class="block text-gray-700">Durée (heures)</label>
              <input
                id="duree"
                type="number"
                [(ngModel)]="newFormation.duree"
                name="duree"
                class="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                aria-required="true"
              >
            </div>
            <div>
              <label for="prix" class="block text-gray-700">Prix (€)</label>
              <input
                id="prix"
                type="number"
                [(ngModel)]="newFormation.prix"
                name="prix"
                class="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                aria-required="true"
              >
            </div>
            <div>
              <label for="image_url" class="block text-gray-700">URL de l'image</label>
              <input
                id="image_url"
                type="text"
                [(ngModel)]="newFormation.image_url"
                name="image_url"
                class="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                aria-required="true"
              >
            </div>
            <div class="flex space-x-4">
              <button
                type="submit"
                [disabled]="addFormationForm.invalid"
                class="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                aria-label="Ajouter la formation"
              >
                Ajouter
              </button>
              <button
                type="button"
                (click)="closeAddFormationModal()"
                class="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300"
                aria-label="Annuler"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </app-modal>
    </section>
  `,
  styles: [`
    h2, h3 { font-family: 'Lato', sans-serif; }
  `],
})
export class ProfileComponent implements OnInit, OnDestroy {
  showSettingsModal = false;
  showAddFormationModal = false;
  userName: string = '';
  userEmail: string = '';
  userPassword: string = '';
  enrolledFormations$: Observable<EnrolledFormation[]>;
  createdFormations$: Observable<CreatedFormation[]>;
  paiements$: Observable<Paiement[]>;
  certificats$: Observable<Certificat[]>;
  user$: Observable<string | null>;
  email$: Observable<string | null>;
  role$: Observable<string | null>;
  newFormation: CreatedFormation = { 
    id: 0, 
    titre: '', 
    description: '',
    categorie: '',
    duree: 0, // number au lieu de string
    prix: 0, 
    image_url: '' 
  };
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private paiementService: PaiementService,
    private certificatService: CertificatService,
    private formationService: FormationService,
    private router: Router
  ) {
    this.user$ = this.authService.getUserName();
    this.email$ = this.authService.getEmail();
    this.role$ = this.authService.getUserRole();
    this.enrolledFormations$ = this.authService.getEnrolledFormations();
    this.createdFormations$ = this.authService.getCreatedFormations();
    this.paiements$ = of([]);
    this.certificats$ = of([]);
  }

  ngOnInit(): void {
    this.authService.getIsLoggedIn().pipe(
      takeUntil(this.destroy$),
      tap(isLoggedIn => {
        if (!isLoggedIn) {
          this.router.navigate(['/login']);
          Swal.fire({
            icon: 'warning',
            title: 'Session expirée',
            text: 'Veuillez vous reconnecter.',
            confirmButtonColor: '#1D4ED8',
          });
          return;
        }
      }),
      switchMap(isLoggedIn => isLoggedIn ? this.authService.getUserId() : of(null)),
      switchMap(userId => {
        if (!userId) return of(null);
        this.paiements$ = this.paiementService.getPaiementsByUser(userId).pipe(
          catchError(() => of([]))
        );
        this.certificats$ = this.certificatService.getCertificatsByUser(userId).pipe(
          catchError(() => of([]))
        );
        return this.role$.pipe(
          switchMap(role => role === 'formateur' ? this.createdFormations$ : of(null))
        );
      })
    ).subscribe();

    this.user$.pipe(takeUntil(this.destroy$)).subscribe(name => this.userName = name || 'Utilisateur');
    this.email$.pipe(takeUntil(this.destroy$)).subscribe(email => this.userEmail = email || 'email@example.com');

    this.authService.paymentUpdated$.pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshData());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private refreshData(): void {
    this.authService.getUserId().pipe(
      switchMap(userId => {
        this.paiements$ = this.paiementService.getPaiementsByUser(userId).pipe(catchError(() => of([])));
        this.certificats$ = this.certificatService.getCertificatsByUser(userId).pipe(catchError(() => of([])));
        return of(null);
      })
    ).subscribe();
  }

  openSettingsModal(): void {
    this.showSettingsModal = true;
  }

  closeSettingsModal(): void {
    this.showSettingsModal = false;
    this.userPassword = '';
  }

  openAddFormationModal(): void {
    this.newFormation = { 
      id: 0, 
      titre: '', 
      description: '',
      categorie: '',
      duree: 0, 
      prix: 0, 
      image_url: '' 
    };
    this.showAddFormationModal = true;
  }

  closeAddFormationModal(): void {
    this.showAddFormationModal = false;
  }

  addFormation(form: NgForm): void {
    if (form.invalid) {
      Swal.fire({ icon: 'warning', title: 'Champs manquants', text: 'Veuillez remplir tous les champs.', confirmButtonColor: '#1D4ED8' });
      return;
    }

    this.formationService.createFormation(this.newFormation).pipe(
      switchMap(createdFormation => this.createdFormations$.pipe(
        tap(formations => this.createdFormations$ = of([...formations, createdFormation]))
      )),
      catchError((error: HttpErrorResponse) => {
        Swal.fire({ icon: 'error', title: 'Erreur', text: error.error?.message || 'Erreur lors de l’ajout.', confirmButtonColor: '#1D4ED8' });
        return of(null);
      })
    ).subscribe(() => {
      Swal.fire({ icon: 'success', title: 'Succès', text: 'Formation ajoutée !', timer: 2000, showConfirmButton: false });
      this.closeAddFormationModal();
    });
  }

  editFormation(formationId: number): void {
    Swal.fire({ icon: 'info', title: 'Non implémenté', text: 'La modification n’est pas encore disponible.', confirmButtonColor: '#1D4ED8' });
  }

  deleteFormation(formationId: number): void {
    Swal.fire({
      title: 'Confirmer la suppression ?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1D4ED8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then(result => {
      if (result.isConfirmed) {
        this.formationService.deleteFormation(formationId).pipe(
          switchMap(() => this.createdFormations$.pipe(
            tap(formations => this.createdFormations$ = of(formations.filter(f => f.id !== formationId)))
          )),
          catchError((error: HttpErrorResponse) => {
            Swal.fire({ icon: 'error', title: 'Erreur', text: error.error?.message || 'Erreur lors de la suppression.', confirmButtonColor: '#1D4ED8' });
            return of(null);
          })
        ).subscribe(() => {
          Swal.fire({ icon: 'success', title: 'Supprimé', text: 'Formation supprimée !', timer: 2000, showConfirmButton: false });
        });
      }
    });
  }

  viewFormationDetails(formationId: number): void {
    this.router.navigate(['/formations', formationId]);
  }

  saveSettings(): void {
    if (!this.userName || !this.userEmail) {
      Swal.fire({ icon: 'warning', title: 'Champs manquants', text: 'Nom et email requis.', confirmButtonColor: '#1D4ED8' });
      return;
    }

    const updateData = { name: this.userName, email: this.userEmail, ...(this.userPassword && { password: this.userPassword }) };
    this.authService.updateUser(updateData).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Succès', text: 'Profil mis à jour !', timer: 2000, showConfirmButton: false });
        this.closeSettingsModal();
      },
      error: (error: HttpErrorResponse) => {
        Swal.fire({ icon: 'error', title: 'Erreur', text: error.error?.message || 'Erreur lors de la mise à jour.', confirmButtonColor: '#1D4ED8' });
      }
    });
  }

  downloadCertificat(certificatId: number): void {
    this.certificatService.downloadCertificat(certificatId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificat-${certificatId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        Swal.fire({ icon: 'success', title: 'Succès', text: 'Certificat téléchargé !', timer: 2000, showConfirmButton: false });
      },
      error: (error: HttpErrorResponse) => {
        Swal.fire({ icon: 'error', title: 'Erreur', text: error.error?.message || 'Erreur lors du téléchargement.', confirmButtonColor: '#1D4ED8' });
      }
    });
  }
}