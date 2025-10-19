import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page';
import { Generator } from './generator/generator';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
   { path: 'generator', component: Generator },
  { path: '**', redirectTo: '' }
];