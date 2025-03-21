import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { FormationListComponent } from './formation-list/formation-list.component';
import { FormationDetailComponent } from './formation-detail/formation-detail.component';
import { ProfileComponent } from './profile/profile.component';
import { ContactComponent } from './contact/contact.component';
import { AboutComponent } from './about/about.component';
import { QuizComponent } from './quiz/quiz.component';
import { ManageFormationsComponent } from './manage-formations/manage-formations.component';
import { AuthGuard } from './guards/auth.guard';
import { ApprenantsInscritsComponent } from './apprenants-inscrits/apprenants-inscrits.component';
import { LeconDetailComponent } from './lecon-detail/lecon-detail.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'formations', component: FormationListComponent },
  { path: 'formations/:id', component: FormationDetailComponent },
  { path: 'formations/:id/lecons', component: LeconDetailComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'about', component: AboutComponent },
  { path: 'quiz/:id', component: QuizComponent },
  { path: 'manage-formations', component: ManageFormationsComponent, canActivate: [AuthGuard] },
  { path: 'formations/:id/apprenants-inscrits', component: ApprenantsInscritsComponent },
  {path:'formations/:id/quiz', component: QuizComponent},
  { path: '**', redirectTo: '' }
];