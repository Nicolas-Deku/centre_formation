import { Component, EventEmitter, Output, Renderer2, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="bg-blue-900 text-white shadow-lg fixed top-0 w-full z-50 font-sans" aria-label="Navigation principale">
      <div class="container mx-auto px-6 py-4 flex justify-between items-center">
        <!-- Logo -->
        <a routerLink="/" class="navbar-brand text-2xl font-bold hover:text-blue-400 transition-colors duration-300">Centre de Formation</a>
        
        <!-- Bouton hamburger pour mobile -->
        <button
          #toggler
          class="navbar-toggler md:hidden focus:outline-none focus:ring-2 focus:ring-blue-400"
          (click)="toggleMenu()"
          aria-label="Ouvrir le menu"
          aria-expanded="false"
          [attr.aria-expanded]="isMenuOpen"
        >
          <span class="block w-6 h-1 bg-white mb-1 transition-all duration-300" [ngClass]="{'rotate-45 translate-y-2': isMenuOpen}"></span>
          <span class="block w-6 h-1 bg-white mb-1 transition-all duration-300" [ngClass]="{'opacity-0': isMenuOpen}"></span>
          <span class="block w-6 h-1 bg-white transition-all duration-300" [ngClass]="{'-rotate-45 -translate-y-2': isMenuOpen}"></span>
        </button>

        <!-- Menu desktop -->
        <div class="hidden md:flex items-center space-x-6">
          <a routerLink="/" class="nav-link">Accueil</a>
          <a routerLink="/formations" class="nav-link">Formations</a>
          <a routerLink="/about" class="nav-link">À Propos</a>
          <a routerLink="/contact" class="nav-link">Contact</a>
          
          <ng-container *ngIf="!(isLoggedIn$ | async); else loggedIn">
            <a href="#" (click)="loginClicked.emit(); $event.preventDefault()" class="nav-link flex items-center">
              <i class="fas fa-user mr-2"></i> Connexion
            </a>
            <a href="#" (click)="registerClicked.emit(); $event.preventDefault()" class="nav-link flex items-center">
              <i class="fas fa-sign-in-alt mr-2"></i> Inscription
            </a>
          </ng-container>
          
          <ng-template #loggedIn>
            <div class="relative">
              <button
                #profileIcon
                class="nav-link flex items-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                (click)="toggleProfileMenu()"
                aria-label="Menu du profil"
                aria-expanded="false"
                [attr.aria-expanded]="isProfileMenuOpen"
              >
                <i class="fas fa-user-circle text-2xl mr-2"></i>
                <span>Bienvenue, {{ (user$ | async)?.name || 'Utilisateur' }}</span>
              </button>
              <div
                *ngIf="isProfileMenuOpen"
                #profileMenu
                class="absolute right-0 mt-2 w-48 bg-blue-800 rounded-md shadow-lg py-2 z-50"
              >
                <a routerLink="/profile" class="dropdown-item" (click)="closeAllMenus()">Paramètres du profil</a>
                <a
                  *ngIf="(role$ | async) === 'formateur'"
                  routerLink="/manage-formations"
                  class="dropdown-item"
                  (click)="closeAllMenus()"
                >
                  Gérer les formations
                </a>
                <a href="#" class="dropdown-item" (click)="onLogout($event)">Déconnexion</a>
              </div>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Menu mobile -->
      <div *ngIf="isMenuOpen" class="md:hidden bg-blue-900 py-2">
        <a routerLink="/" class="mobile-nav-link" (click)="toggleMenu()">Accueil</a>
        <a routerLink="/formations" class="mobile-nav-link" (click)="toggleMenu()">Formations</a>
        <a routerLink="/about" class="mobile-nav-link" (click)="toggleMenu()">À Propos</a>
        <a routerLink="/contact" class="mobile-nav-link" (click)="toggleMenu()">Contact</a>
        
        <ng-container *ngIf="!(isLoggedIn$ | async); else loggedInMobile">
          <a href="#" (click)="loginClicked.emit(); $event.preventDefault(); toggleMenu()" class="mobile-nav-link">Connexion</a>
          <a href="#" (click)="registerClicked.emit(); $event.preventDefault(); toggleMenu()" class="mobile-nav-link">Inscription</a>
        </ng-container>
        
        <ng-template #loggedInMobile>
          <button
            class="mobile-nav-link flex items-center w-full text-left"
            (click)="toggleProfileMenuMobile()"
            aria-label="Menu du profil mobile"
            aria-expanded="false"
            [attr.aria-expanded]="isProfileMenuMobileOpen"
          >
            <i class="fas fa-user-circle mr-2"></i> Profil
          </button>
          <div *ngIf="isProfileMenuMobileOpen" class="pl-6">
            <a routerLink="/profile" class="dropdown-item" (click)="closeAllMenus()">Paramètres du profil</a>
            <a
              *ngIf="(role$ | async) === 'formateur'"
              routerLink="/manage-formations"
              class="dropdown-item"
              (click)="closeAllMenus()"
            >
              Gérer les formations
            </a>
            <a href="#" class="dropdown-item" (click)="onLogout($event)">Déconnexion</a>
          </div>
        </ng-template>
      </div>
    </nav>
  `,
  styles: [`
    .nav-link {
      position: relative;
      text-transform: uppercase;
      transition: all 0.3s ease;
    }
    .nav-link:hover {
      color: #60A5FA; /* blue-400 */
    }
    .nav-link:after {
      content: '';
      position: absolute;
      width: 0;
      height: 2px;
      background-color: #60A5FA; /* blue-400 */
      bottom: -4px;
      left: 0;
      transition: width 0.3s ease;
    }
    .nav-link:hover:after {
      width: 100%;
    }
    .mobile-nav-link {
      display: block;
      padding: 0.5rem 1rem;
      text-transform: uppercase;
      transition: all 0.3s ease;
    }
    .mobile-nav-link:hover {
      background-color: #1E3A8A; /* blue-950 */
      color: #60A5FA; /* blue-400 */
    }
    .dropdown-item {
      display: block;
      padding: 0.5rem 1rem;
      transition: all 0.3s ease;
    }
    .dropdown-item:hover {
      background-color: #1E3A8A; /* blue-950 */
      color: #93C5FD; /* blue-300 */
    }
    /* Animation hamburger */
    .navbar-brand {
      font-family: 'Lato', sans-serif;
    }
  `],
})
export class NavbarComponent {
  isMenuOpen = false;
  isProfileMenuOpen = false;
  isProfileMenuMobileOpen = false;
  isLoggedIn$: Observable<boolean>;
  user$: Observable<any>; // Ajusté pour correspondre à User dans AuthService
  role$: Observable<string | null>;

  @ViewChild('toggler') toggler!: ElementRef;
  @ViewChild('profileIcon') profileIcon!: ElementRef;
  @ViewChild('profileMenu') profileMenu!: ElementRef;

  @Output() loginClicked = new EventEmitter<void>();
  @Output() registerClicked = new EventEmitter<void>();

  constructor(private authService: AuthService, private renderer: Renderer2) {
    this.isLoggedIn$ = this.authService.getIsLoggedIn();
    this.user$ = this.authService.getUser(); // Retourne un Observable<User>
    this.role$ = this.authService.getUserRole();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (!this.isMenuOpen) {
      this.isProfileMenuMobileOpen = false;
    }
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  toggleProfileMenuMobile() {
    this.isProfileMenuMobileOpen = !this.isProfileMenuMobileOpen;
  }

  closeAllMenus() {
    this.isMenuOpen = false;
    this.isProfileMenuOpen = false;
    this.isProfileMenuMobileOpen = false;
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    if (
      this.isProfileMenuOpen &&
      this.profileMenu &&
      this.profileIcon &&
      !this.profileMenu.nativeElement.contains(event.target) &&
      !this.profileIcon.nativeElement.contains(event.target)
    ) {
      this.isProfileMenuOpen = false;
    }
  }

  onLogout(event: Event) {
    event.preventDefault();
    this.authService.logout().subscribe({
      next: () => {
        this.closeAllMenus();
        Swal.fire({
          icon: 'success',
          title: 'Déconnexion réussie',
          text: 'Vous avez été déconnecté.',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        });
      },
      error: (err) => {
        console.error('Erreur lors de la déconnexion:', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur est survenue lors de la déconnexion.',
          confirmButtonColor: '#1D4ED8',
        });
      },
    });
  }
}