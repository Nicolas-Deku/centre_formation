import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="bg-gray-900 text-white py-8">
      <div class="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Section 1 : Logo et Description -->
        <div>
          <h3 class="text-xl font-bold mb-4 transform hover:scale-105 transition-transform duration-300">
            Centre de Formation
          </h3>
          <p class="text-gray-400">
            Votre partenaire pour une formation professionnelle de qualité.
          </p>
        </div>

        <!-- Section 2 : Liens -->
        <div>
          <h4 class="text-lg font-semibold mb-4">Liens Utiles</h4>
          <ul class="space-y-2">
            <li><a href="#" class="text-gray-400 hover:text-white transition-colors duration-300">Formations</a></li>
            <li><a href="#" class="text-gray-400 hover:text-white transition-colors duration-300">Certificats</a></li>
            <li><a href="#" class="text-gray-400 hover:text-white transition-colors duration-300">Support</a></li>
          </ul>
        </div>

        <!-- Section 3 : Contact -->
        <div>
          <h4 class="text-lg font-semibold mb-4">Contactez-nous</h4>
          <p class="text-gray-400">Email: contactformationpro.fr</p>
          <p class="text-gray-400">Tel: +33 1 23 45 67 89</p>
        </div>
      </div>
      <div class="mt-8 text-center text-gray-500 text-sm">
        © 2025 Centre de Formation. Tous droits réservés.
      </div>
    </footer>
  `,
})
export class FooterComponent {}