import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FormationService } from '../services/formation.service';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Formation } from '../models/formation.model';

@Component({
  selector: 'app-formation-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <section class="py-20 bg-gray-100 min-h-screen">
      <div class="container mx-auto px-6">
        <!-- Titre -->
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold text-gray-900">
            Nos <span class="text-blue-600">Formations</span>
          </h2>
          <p class="mt-2 text-gray-600 text-lg">
            Trouvez la formation qui correspond à vos ambitions professionnelles.
          </p>
        </div>

        <!-- Recherche et tri -->
        <div class="mb-12 flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange()"
              placeholder="Rechercher une formation..."
              class="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              aria-label="Rechercher une formation"
            />
            <select
              [(ngModel)]="sortByPrice"
              (ngModelChange)="filterAndSortFormations()"
              class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              aria-label="Trier par prix"
            >
              <option value="">Trier par prix</option>
              <option value="asc">Prix croissant</option>
              <option value="desc">Prix décroissant</option>
            </select>
          </div>
          <div class="text-gray-600 font-medium">
            {{ filteredFormations.length }} formations trouvées
          </div>
        </div>

        <!-- Liste des formations -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            *ngFor="let formation of paginatedFormations"
            class="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 text-center"
          >
            <div class="mb-4">
              <img
                [src]="formation.image_url ? apiUrl + '/storage/' + formation.image_url : 'assets/default-formation.png'"
                [alt]="formation.titre"
                class="mx-auto h-16 w-16 object-cover rounded-full"
                (error)="onImageError($event)"
              />
            </div>
            <div>
              <h5 class="font-bold uppercase text-lg text-gray-800 mb-2">{{ formation.titre }}</h5>
              <p class="text-gray-600 mb-2 line-clamp-2">{{ formation.description }}</p>
              <p class="text-gray-500 mb-2">Durée : {{ formation.duree }}h - Prix : {{ formation.prix }}€</p>
              <a
                [routerLink]="['/formations', formation.id]"
                class="text-blue-600 font-semibold hover:text-blue-700 transition-colors duration-300"
              >
                En savoir plus
              </a>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="mt-12 flex justify-center items-center gap-4">
          <button
            (click)="previousPage()"
            [disabled]="currentPage === 1"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300"
            aria-label="Page précédente"
          >
            Précédent
          </button>
          <span class="text-gray-600 font-medium">Page {{ currentPage }} sur {{ totalPages }}</span>
          <button
            (click)="nextPage()"
            [disabled]="currentPage === totalPages"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300"
            aria-label="Page suivante"
          >
            Suivant
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    h2 {
      font-family: 'Lato', sans-serif;
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormationListComponent implements OnInit {
  formations: Formation[] = [];
  filteredFormations: Formation[] = [];
  paginatedFormations: Formation[] = [];
  searchTerm: string = '';
  sortByPrice: '' | 'asc' | 'desc' = '';
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 1;
  apiUrl: string = 'http://127.0.0.1:8000'; // URL de base de l'API

  private searchSubject = new Subject<string>();

  constructor(
    private formationService: FormationService,
    private cdr: ChangeDetectorRef // Ajouté pour OnPush
  ) {}

  ngOnInit(): void {
    this.loadFormations();
    this.setupSearchDebounce();
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/default-formation.png';
    console.error('Image failed to load:', img.src);
  }

  loadFormations(): void {
    this.formationService.getFormations().subscribe({
      next: (formations: Formation[]) => {
        this.formations = formations.map(formation => ({
          ...formation,
          image_url: formation.image_url || 'assets/default-formation.png', // Simplifié
          description: formation.description || 'Aucune description disponible',
        }));
        this.filteredFormations = [...this.formations];
        this.updatePagination();
        this.cdr.markForCheck(); // Nécessaire avec OnPush
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des formations:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: `Impossible de charger les formations. ${error.error?.message || 'Veuillez réessayer.'}`,
          confirmButtonColor: '#1D4ED8',
        });
      },
    });
  }

  setupSearchDebounce(): void {
    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.filterAndSortFormations();
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  filterAndSortFormations(): void {
    let filtered = [...this.formations];
    const term = this.searchTerm.toLowerCase().trim();

    if (term) {
      filtered = filtered.filter(formation =>
        formation.titre.toLowerCase().includes(term) ||
        formation.description.toLowerCase().includes(term)
      );
    }

    if (this.sortByPrice === 'asc') {
      filtered.sort((a, b) => a.prix - b.prix);
    } else if (this.sortByPrice === 'desc') {
      filtered.sort((a, b) => b.prix - a.prix);
    }

    this.filteredFormations = filtered;
    this.currentPage = 1;
    this.updatePagination();
    this.cdr.markForCheck(); // Nécessaire avec OnPush
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredFormations.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedFormations = this.filteredFormations.slice(startIndex, endIndex);
    this.cdr.markForCheck(); // Nécessaire avec OnPush
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }
}