import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form (ngSubmit)="onSubmit()" class="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
        <input
          id="email"
          type="email"
          [(ngModel)]="email"
          name="email"
          class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">Mot de passe</label>
        <input
          id="password"
          type="password"
          [(ngModel)]="password"
          name="password"
          class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <button
        type="submit"
        [disabled]="isLoading"
        class="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 transition-all duration-300"
      >
        {{ isLoading ? 'Connexion en cours...' : 'Se connecter' }}
      </button>
    </form>
  `,
})
export class LoginFormComponent {
  @Input() isLoading = false;
  @Output() close = new EventEmitter<void>();
  email = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.email || !this.password) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Veuillez remplir tous les champs.',
        confirmButtonColor: '#1D4ED8',
      });
      return;
    }

    this.isLoading = true;
    this.authService.login(this.email, this.password).subscribe({
      next: (success) => {
        this.isLoading = false;
        if (success) {
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Connexion réussie ! Redirection...',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
          }).then(() => {
            this.close.emit();
            this.router.navigate(['/profile']);
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Email ou mot de passe incorrect.',
            confirmButtonColor: '#1D4ED8',
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur est survenue.',
          confirmButtonColor: '#1D4ED8',
        });
      },
    });
  }
}