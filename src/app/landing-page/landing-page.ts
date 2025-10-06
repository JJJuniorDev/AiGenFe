import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Testimonial } from '../model/Testimonial.model';
import { AuthService } from '../services/AuthService.service';
import { TestimonialService } from '../services/TestimonialService.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing-page.html',
  styleUrls: ['./landing-page.css']
})
export class LandingPageComponent {
  // Login / Sign-up
  email = '';
  password = '';
  loggedIn = false;
platform = 'linkedin';

  // Testimonial generation
  inputText = '';
  output?: Testimonial;
modalOpen = false;
  selectedKey: 'linkedinPost' | 'headline' | 'shortQuote' = 'linkedinPost';
readonly outputKeys: ('linkedinPost' | 'headline' | 'shortQuote')[] = ['linkedinPost', 'headline', 'shortQuote'];
  
postTypes = ['testimonial', 'promozionale', 'educativo', 'storia cliente'] as const;
selectedPostType: 'testimonial' | 'promozionale' | 'educativo' | 'storia cliente' = 'testimonial';


// Tono come slider (0 = neutro, 100 = massimo emozionale/rabbia)
toneValue = 50;

// Stile come slider (0 = semplice, 100 = super creativo)
styleValue = 50;

constructor(private authService: AuthService,
              private testimonialService: TestimonialService,
            private toastr: ToastrService) {}

  // Autenticazione
  login() {
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: res => {
        this.authService.saveToken(res.token);
        this.loggedIn = true;
        this.toastr.success('Login effettuato con successo ✅');
      },
      error: () => this.toastr.error('Email o password errate ❌')
    });
  }

  signup() {
    this.authService.signup({ email: this.email, password: this.password }).subscribe({
      next: res => {
        this.toastr.info('Registrazione completata! 📧 Controlla la tua mail per confermare.');
      },
      error: () => this.toastr.warning('Email già registrata ⚠️')
    });
  }

  // Generazione testimonial
  generate() {
    this.testimonialService.generate({ 
      inputText: this.inputText,
      platform: this.platform,
       postType: this.selectedPostType,
    tone: this.toneValue,
    style: this.styleValue
     }).subscribe({
      next: res => {
        this.output = res,
         this.toastr.success('Contenuto generato con successo 🎉');
      },
      error: () => this.toastr.error('Errore durante la generazione 😢')
    });
  }

  logout() {
    this.authService.logout();
    this.loggedIn = false;
    this.email = '';
    this.password = '';
    this.output = undefined;
    this.toastr.info('Logout effettuato 👋');
  }

  // Apri modal con la card cliccata
  openModal(key: 'linkedinPost' | 'headline' | 'shortQuote') {
    this.selectedKey = key;
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
  }

  // Formatta il titolo della card
  formatTitle(key: 'linkedinPost' | 'headline' | 'shortQuote') {
    return key === 'linkedinPost' ? 'LinkedIn Post'
         : key === 'headline' ? 'Headline'
         : 'Short Quote';
  }

  get selectedVersions(): string[] {
  if (!this.output) return [];
  switch (this.selectedKey) {
    case 'linkedinPost': return this.output.linkedinPostVersions;
    case 'headline': return this.output.headlineVersions;
    case 'shortQuote': return this.output.shortQuoteVersions;
  }
}
}