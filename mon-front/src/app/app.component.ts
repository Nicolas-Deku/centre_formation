import { Component } from '@angular/core';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { RouterOutlet } from '@angular/router';
import { ModalComponent } from './modal/modal.component';
import { LoginFormComponent } from './login-form/login-form.component';
import { RegisterFormComponent } from './register-form/register-form.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NavbarComponent,
    FooterComponent,
    RouterOutlet,
    ModalComponent,
    LoginFormComponent,
    RegisterFormComponent,
  ],
  template: `
    <app-navbar
      (loginClicked)="openLoginModal()"
      (registerClicked)="openRegisterModal()"
    ></app-navbar>

    <main class="min-h-screen bg-gray-100 pt-16">
      <router-outlet></router-outlet>
    </main>

    <app-footer></app-footer>

    <app-modal [isOpen]="showLoginModal" (closeModal)="closeLoginModal()">
      <app-login-form></app-login-form>
    </app-modal>

    <app-modal [isOpen]="showRegisterModal" (closeModal)="closeRegisterModal()">
      <app-register-form ></app-register-form>
    </app-modal>
  `,
})
export class AppComponent {
  showLoginModal = false;
  showRegisterModal = false;

  constructor(private authService: AuthService) {}

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

  onLogin(data: { email: string; password: string }) {
    this.authService.login(data.email, data.password);
    this.closeLoginModal();
  }

  onRegister(data: { name: string; email: string; password: string }) {
    this.authService.login(data.email,data.password);
    this.closeRegisterModal();
  }
}