import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  description: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="about_section py-20 bg-gray-100 min-h-screen">
      <div class="container mx-auto px-6">
        <!-- Titre -->
        <div class="heading_container text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold" style="font-family: 'Lato', sans-serif;">À <span class="text-blue-400">Propos</span> de Nous</h2>
          <p class="mt-2 text-gray-600 text-lg">Découvrez qui nous sommes et ce qui nous motive.</p>
        </div>

        <!-- Introduction -->
        <div class="bg-white p-8 rounded-lg shadow-md mb-12">
          <h3 class="text-2xl font-bold mb-4" style="font-family: 'Lato', sans-serif;">Notre Mission</h3>
          <p class="text-gray-600 leading-relaxed">
            Le Centre de Formation Professionnelle a pour mission de fournir des formations de haute qualité, accessibles à tous, pour aider les individus à atteindre leur plein potentiel. Nous croyons en l'apprentissage continu et en l'impact transformateur de l'éducation.
          </p>
          <p class="text-gray-600 leading-relaxed mt-4">
            Depuis notre création, nous avons formé des milliers de professionnels dans divers domaines, allant du développement web au graphisme, en passant par la gestion de projet. Notre objectif est de préparer nos apprenants à réussir dans un monde en constante évolution.
          </p>
        </div>

        <!-- Nos Valeurs -->
        <div class="bg-white p-8 rounded-lg shadow-md mb-12">
          <h3 class="text-2xl font-bold mb-4" style="font-family: 'Lato', sans-serif;">Nos Valeurs</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
              <i class="fa fa-star text-blue-400 text-3xl mb-4"></i>
              <h4 class="font-semibold text-lg">Qualité</h4>
              <p class="text-gray-600">Nous offrons des formations conçues par des experts pour garantir une expérience d'apprentissage exceptionnelle.</p>
            </div>
            <div class="text-center">
              <i class="fa fa-universal-access text-blue-400 text-3xl mb-4"></i>
              <h4 class="font-semibold text-lg">Accessibilité</h4>
              <p class="text-gray-600">Nos formations sont ouvertes à tous, peu importe votre niveau ou votre parcours.</p>
            </div>
            <div class="text-center">
              <i class="fa fa-trophy text-blue-400 text-3xl mb-4"></i>
              <h4 class="font-semibold text-lg">Excellence</h4>
              <p class="text-gray-600">Nous visons l'excellence dans tout ce que nous faisons, de la pédagogie à l'accompagnement.</p>
            </div>
          </div>
        </div>

        <!-- Notre Équipe -->
        <div class="bg-white p-8 rounded-lg shadow-md mb-12">
          <h3 class="text-2xl font-bold mb-4" style="font-family: 'Lato', sans-serif;">Notre Équipe</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div *ngFor="let member of team" class="p-4 border rounded-lg shadow-sm text-center">
              <img [src]="member.image" [alt]="member.name" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover">
              <h4 class="font-semibold text-lg">{{ member.name }}</h4>
              <p class="text-gray-600">{{ member.role }}</p>
              <p class="text-gray-500 mt-2">{{ member.description }}</p>
            </div>
          </div>
        </div>

        <!-- Appel à l'action -->
        <div class="text-center">
          <h3 class="text-2xl font-bold mb-4" style="font-family: 'Lato', sans-serif;">Prêt à vous former ?</h3>
          <p class="text-gray-600 mb-6">Explorez nos formations et commencez votre parcours dès aujourd'hui !</p>
          <a routerLink="/formations" class="bg-blue-400 text-white px-6 py-3 rounded-none hover:bg-blue-500 transition-all duration-300 text-lg">
            Découvrir nos formations
          </a>
        </div>
      </div>
    </section>
  `,
  styles: []
})
export class AboutComponent {
  team: TeamMember[] = [
    {
      name: 'Marie Dupont',
      role: 'Directrice',
      image: 'assets/team1.jpg',
      description: 'Marie a plus de 15 ans d’expérience dans l’éducation et la formation professionnelle.'
    },
    {
      name: 'Jean Martin',
      role: 'Formateur Principal',
      image: 'assets/team2.jpg',
      description: 'Jean est expert en développement web et accompagne nos apprenants avec passion.'
    },
    {
      name: 'Sophie Leroux',
      role: 'Responsable Pédagogique',
      image: 'assets/team3.jpg',
      description: 'Sophie veille à la qualité et à la pertinence de nos programmes de formation.'
    }
  ];
}