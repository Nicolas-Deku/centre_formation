import { Component, Input, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700">Nom</label>
        <input
          id="name"
          type="text"
          formControlName="name"
          class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          [ngClass]="{'border-red-500': registerForm.get('name')?.touched && registerForm.get('name')?.invalid}"
        />
        <div *ngIf="registerForm.get('name')?.touched && registerForm.get('name')?.invalid" class="text-red-500 text-sm mt-1">
          <span *ngIf="registerForm.get('name')?.errors?.['required']">Le nom est requis.</span>
          <span *ngIf="registerForm.get('name')?.errors?.['minlength']">Le nom doit contenir au moins 2 caractères.</span>
        </div>
      </div>
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
        <input
          id="email"
          type="email"
          formControlName="email"
          class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          [ngClass]="{'border-red-500': registerForm.get('email')?.touched && registerForm.get('email')?.invalid}"
        />
        <div *ngIf="registerForm.get('email')?.touched && registerForm.get('email')?.invalid" class="text-red-500 text-sm mt-1">
          <span *ngIf="registerForm.get('email')?.errors?.['required']">L’email est requis.</span>
          <span *ngIf="registerForm.get('email')?.errors?.['email']">Veuillez entrer un email valide.</span>
        </div>
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">Mot de passe</label>
        <input
          id="password"
          type="password"
          formControlName="password"
          class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          [ngClass]="{'border-red-500': registerForm.get('password')?.touched && registerForm.get('password')?.invalid}"
        />
        <div *ngIf="registerForm.get('password')?.touched && registerForm.get('password')?.invalid" class="text-red-500 text-sm mt-1">
          <span *ngIf="registerForm.get('password')?.errors?.['required']">Le mot de passe est requis.</span>
          <span *ngIf="registerForm.get('password')?.errors?.['minlength']">Le mot de passe doit contenir au moins 6 caractères.</span>
        </div>
      </div>
      <div>
        <label for="passwordConfirm" class="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
        <input
          id="passwordConfirm"
          type="password"
          formControlName="passwordConfirm"
          class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          [ngClass]="{'border-red-500': registerForm.get('passwordConfirm')?.touched && registerForm.errors?.['passwordMismatch']}"
        />
        <div *ngIf="registerForm.get('passwordConfirm')?.touched && registerForm.errors?.['passwordMismatch']" class="text-red-500 text-sm mt-1">
          Les mots de passe ne correspondent pas.
        </div>
      </div>
      <div>
        <label for="role" class="block text-sm font-medium text-gray-700">Rôle</label>
        <select
          id="role"
          formControlName="role"
          class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          [ngClass]="{'border-red-500': registerForm.get('role')?.touched && registerForm.get('role')?.invalid}"
        >
          <option value="" disabled>Sélectionnez un rôle</option>
          <option value="apprenant">Apprenant</option>
          <option value="formateur">Formateur</option>
        </select>
        <div *ngIf="registerForm.get('role')?.touched && registerForm.get('role')?.invalid" class="text-red-500 text-sm mt-1">
          Veuillez sélectionner un rôle.
        </div>
      </div>
      <button
        type="submit"
        [disabled]="isLoading || registerForm.invalid"
        class="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 transition-all duration-300"
      >
        <span *ngIf="isLoading">Inscription en cours...</span>
        <span *ngIf="!isLoading">S'inscrire</span>
      </button>
    </form>
  `,
})
export class RegisterFormComponent implements OnInit {
  @Input() isLoading = false;
  registerForm: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirm: ['', Validators.required],
      role: ['apprenant', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {}

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const passwordConfirm = form.get('passwordConfirm')?.value;
    return password === passwordConfirm ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Veuillez corriger les erreurs dans le formulaire.',
        confirmButtonColor: '#1D4ED8',
      });
      this.registerForm.markAllAsTouched(); // Marque tous les champs comme touchés pour afficher les erreurs
      return;
    }

    const { name, email, password, role } = this.registerForm.value;
    this.isLoading = true;
    this.authService.register(name, email, password, role).subscribe({
      next: (success) => {
        this.isLoading = false;
        if (success) {
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Inscription réussie ! Redirection...',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
          }).then(() => {
            this.router.navigate(['/profile']);
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Une erreur est survenue lors de l’inscription.',
            confirmButtonColor: '#1D4ED8',
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.error?.message || 'Une erreur est survenue.',
          confirmButtonColor: '#1D4ED8',
        });
      },
    });
  }
}