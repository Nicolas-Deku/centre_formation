import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { LoginFormComponent } from '../login-form/login-form.component';
import { RegisterFormComponent } from '../register-form/register-form.component';
import { AuthService } from '../services/auth.service';
import { FormationService } from '../services/formation.service';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ModalComponent, LoginFormComponent, RegisterFormComponent, RouterLink, NavbarComponent],
  template: `
    <div class="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-900">
      <app-navbar (loginClicked)="openLoginModal()" (registerClicked)="openRegisterModal()"></app-navbar>
      
      <!-- Hero Section -->
      <section class="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white overflow-hidden">
        <img src="assets/img/hero-bg.png" class="absolute inset-0 w-full h-full object-cover opacity-20">
        <div class="container mx-auto px-6 py-20 relative z-10">
          <div class="flex flex-col md:flex-row items-center">
            <div class="md:w-1/2 mb-10 md:mb-0">
              <h1 class="text-4xl md:text-5xl font-bold mb-6 leading-tight">Formation Professionnelle</h1>
              <p class="text-lg md:text-xl mb-8">Développez vos compétences avec nos formations certifiées et excellez dans votre carrière.</p>
              <button (click)="openRegisterModal()" class="bg-white text-blue-600 px-8 py-3 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 font-semibold">
                Découvrir
              </button>
            </div>
            <div class="md:w-1/2">
              <img src="assets/img/slider-img.png" alt="Formation" class="w-full animate-bounce-slow">
            </div>
          </div>
        </div>
      </section>

      <!-- Formations Section -->
      <section class="py-20 bg-white">
        <div class="container mx-auto px-6">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold">Nos <span class="text-blue-600">Formations</span></h2>
            <p class="mt-4 text-gray-600 text-lg">Boostez vos compétences avec nos programmes professionnels.</p>
          </div>
          <div class="relative">
            <button (click)="prevFormation()" [disabled]="currentTranslateX >= 0" class="absolute left-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white w-12 h-12 rounded-full hover:bg-blue-700 transition-all duration-300 z-10 disabled:bg-gray-300">
              <svg class="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <div class="overflow-hidden">
              <div class="flex transition-transform duration-500 ease-in-out" [style.transform]="'translateX(' + currentTranslateX + 'px)'">
                <div *ngFor="let formation of formations" class="flex-shrink-0 w-80 mx-4">
                  <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                  <img [src]="formation.image_url ? 'http://127.0.0.1:8000/storage/' + formation.image_url : 'assets/img/vecteezy_3d-isolated-document-format-icon_11098887.png'" [alt]="formation.titre" class="h-24 w-24 mx-auto mb-4 rounded-full object-cover" (error)="onImageError($event)">
                    <h5 class="text-lg font-semibold text-gray-800">{{ formation.titre }}</h5>
                    <p class="text-sm text-gray-600 line-clamp-2">{{ formation.description }}</p>
                    <p class="text-sm text-gray-500 mt-2">Catégorie: {{ formation.categorie }}</p>
                    <p class="text-sm text-gray-500">Durée: {{ formation.duree }}h - Prix: {{ formation.prix }}€</p>
                    <a [routerLink]="['/formations', formation.id]" class="block mt-4 text-blue-600 font-semibold hover:text-blue-700 transition-colors">En savoir plus</a>
                  </div>
                </div>
              </div>
            </div>
            <button (click)="nextFormation()" [disabled]="currentTranslateX <= maxTranslate" class="absolute right-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white w-12 h-12 rounded-full hover:bg-blue-700 transition-all duration-300 z-10 disabled:bg-gray-300">
              <svg class="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
          <div class="text-center mt-12">
            <a [routerLink]="['/formations']" class="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-all duration-300 font-semibold">
              Voir toutes les formations
            </a>
          </div>
        </div>
      </section>

      <!-- About Section -->
      <section class="py-20 bg-gray-800 text-white">
        <div class="container mx-auto px-6">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold">À propos de <span class="text-blue-400">nous</span></h2>
            <p class="mt-4 text-gray-300 text-lg">Notre mission est de vous accompagner vers la réussite.</p>
          </div>
          <div class="flex flex-col md:flex-row items-center gap-8">
            <div class="md:w-1/2">
              <img src="assets/img/vecteezy_online-education-concept-illustration-digital-classroom_10869731.png" alt="About" class="w-full rounded-lg shadow-lg">
            </div>
            <div class="md:w-1/2">
              <h3 class="text-2xl md:text-3xl font-bold mb-4">Centre de Formation</h3>
              <p class="mb-4 text-gray-300 text-lg">Nous proposons des formations de qualité avec un accompagnement personnalisé pour atteindre vos objectifs.</p>
              <a routerLink="/about" class="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-all duration-300 font-semibold">
                En savoir plus
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Modals -->
      <app-modal [isOpen]="showLoginModal" (closeModal)="closeLoginModal()">
        <app-login-form [isLoading]="isLoading" (close)="closeLoginModal()"></app-login-form>
      </app-modal>
      <app-modal [isOpen]="showRegisterModal" (closeModal)="closeRegisterModal()">
        <app-register-form [isLoading]="isLoading"></app-register-form>
      </app-modal>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .animate-bounce-slow {
      animation: bounce 3s infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `],
})
export class HomeComponent implements OnInit {
  formations: any[] = [];
  showLoginModal = false;
  showRegisterModal = false;
  isLoading = false;
  currentTranslateX = 0;
  itemWidth = 352; // 80 (w-80) + 2*16 (mx-4) = 352px
  maxVisibleItems = 3;
  maxTranslate = 0;

  constructor(private authService: AuthService, private formationService: FormationService, private router: Router) {}

  ngOnInit(): void {
    this.loadFormations();
  }

  loadFormations(): void {
    this.formationService.getFormations().subscribe({
      next: (formations) => {
        this.formations = formations;
        this.maxTranslate = -(Math.max(0, this.formations.length - this.maxVisibleItems) * this.itemWidth);
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les formations.',
          confirmButtonColor: '#1D4ED8',
        });
      },
    });
  }

  onImageError(event: Event) {
    console.error('Image failed to load:', (event.target as HTMLImageElement).src);
    (event.target as HTMLImageElement).src = 'assets/img/vecteezy_3d-isolated-document-format-icon_11098887.png';
  }

  openLoginModal() {
    this.showLoginModal = true;
  }

  closeLoginModal() {
    this.showLoginModal = false;
  }

  openRegisterModal() {
    this.showRegisterModal = true;
  }

  closeRegisterModal() {
    this.showRegisterModal = false;
  }

  nextFormation() {
    if (this.currentTranslateX > this.maxTranslate) {
      this.currentTranslateX -= this.itemWidth;
    }
  }

  prevFormation() {
    if (this.currentTranslateX < 0) {
      this.currentTranslateX += this.itemWidth;
    }
  }
}