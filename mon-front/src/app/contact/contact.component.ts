import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="contact_section py-20 bg-gray-100 min-h-screen">
      <div class="container mx-auto px-6">
        <!-- Titre -->
        <div class="heading_container text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold" style="font-family: 'Lato', sans-serif;">Nous <span class="text-blue-400">Contacter</span></h2>
          <p class="mt-2 text-gray-600 text-lg">Nous sommes là pour vous aider. Contactez-nous !</p>
        </div>

        <!-- Informations de contact -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          <div class="bg-white p-8 rounded-lg shadow-md">
            <h3 class="text-2xl font-bold mb-4" style="font-family: 'Lato', sans-serif;">Nos Coordonnées</h3>
            <p class="text-gray-600 mb-2"><strong>Email :</strong> contactformationpro.fr</p>
            <p class="text-gray-600 mb-2"><strong>Téléphone :</strong> +33 1 23 45 67 89</p>
            <p class="text-gray-600"><strong>Adresse :</strong> 123 Rue de la Formation, 75001 Paris, France</p>
          </div>

          <!-- Formulaire de contact -->
          <div class="bg-white p-8 rounded-lg shadow-md">
            <h3 class="text-2xl font-bold mb-4" style="font-family: 'Lato', sans-serif;">Envoyez-nous un message</h3>
            <form #contactForm="ngForm" (ngSubmit)="onSubmit(contactForm)" class="space-y-4">
              <div>
                <label for="name" class="block text-gray-700">Nom</label>
                <input id="name" name="name" [(ngModel)]="contactMessage.name" class="w-full border border-gray-300 rounded-none px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" required>
              </div>
              <div>
                <label for="email" class="block text-gray-700">Email</label>
                <input id="email" type="email" name="email" [(ngModel)]="contactMessage.email" class="w-full border border-gray-300 rounded-none px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" required>
              </div>
              <div>
                <label for="subject" class="block text-gray-700">Sujet</label>
                <input id="subject" name="subject" [(ngModel)]="contactMessage.subject" class="w-full border border-gray-300 rounded-none px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" required>
              </div>
              <div>
                <label for="message" class="block text-gray-700">Message</label>
                <textarea id="message" name="message" [(ngModel)]="contactMessage.message" rows="4" class="w-full border border-gray-300 rounded-none px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" required></textarea>
              </div>
              <button type="submit" [disabled]="!contactForm.valid" class="bg-blue-400 text-white px-6 py-3 rounded-none hover:bg-blue-500 transition-all duration-300">
                Envoyer
              </button>
              <p *ngIf="messageSent" class="text-green-600 mt-2">Message envoyé avec succès !</p>
            </form>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: []
})
export class ContactComponent {
  contactMessage: ContactMessage = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };
  messageSent: boolean = false;

  onSubmit(form: any) {
    if (form.valid) {
      console.log('Message envoyé :', this.contactMessage);
      this.messageSent = true;
      this.contactMessage = { name: '', email: '', subject: '', message: '' }; // Réinitialiser le formulaire
      setTimeout(() => {
        this.messageSent = false; // Masquer le message après 3 secondes
      }, 3000);
    }
  }
}