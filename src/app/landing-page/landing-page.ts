import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Testimonial } from '../model/Testimonial.model';
import { AuthService } from '../services/AuthService.service';
import { TestimonialService } from '../services/TestimonialService.service';
import { ToastrService } from 'ngx-toastr';
import { BrandProfile } from '../model/BrandProfile.model';
import { BrandProfileService, ToneType } from '../services/BrandProfileService.service';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../model/User.model';
import { Avatar } from '../model/Avatar.model';
import { AvatarService } from '../services/Avatar.service';
import { CreditPackage } from '../model/CreditPackage.model';
import { CreditPackageService } from '../services/CreditPackage.service';
import { Router, RouterModule } from '@angular/router';
import { UserStateService } from '../services/UserStateService.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterModule],
  templateUrl: './landing-page.html',
  styleUrls: ['./landing-page.css']
})
export class LandingPageComponent implements OnInit {
  user: User | null = null;
  email = '';
  password = '';
  loggedIn: boolean | null = null;
  showAuthOverlay = false;
  creditPackages: CreditPackage[] = [];

  constructor(
    private authService: AuthService,
    private toastr: ToastrService,
    private creditPackageService: CreditPackageService,
    private router: Router,
    private userStateService: UserStateService
  ) {}

  ngOnInit() {
    // ✅ SOTTOSCRIVI AI CAMBIAMENTI
    this.userStateService.currentUser$.subscribe(user => {
      this.user = user;
      this.loggedIn = !!user;
      console.log('🏠 LandingPage - User:', user?.email);
    });
    
     this.loadInitialUser();
     this.loadCreditPackages();
  }

   private loadInitialUser() {
    if (this.authService.isLoggedIn()) {
      const cachedUser = this.userStateService.getUser();
      if (!cachedUser) {
        // Ricarica dall'API se necessario
        this.authService.getCurrentUser().subscribe({
          next: (user) => this.userStateService.setUser(user),
          error: () => this.authService.logout()
        });
      }
    }
  }

  loadCreditPackages() {
    this.creditPackageService.getActivePackages().subscribe({
      next: (packages) => {
        this.creditPackages = packages;
      },
      error: (error) => {
        console.error('Errore caricamento pacchetti:', error);
      }
    });
  }

  purchaseCredits(creditPackage: CreditPackage) {
    this.creditPackageService.purchasePackage(creditPackage.id).subscribe({
      next: (response) => {
        window.location.href = response.checkoutUrl;
      },
      error: (error) => {
        this.toastr.error('Errore durante l\'acquisto');
      }
    });
  }

  login() {
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: res => {
        this.authService.saveToken(res.token);
        this.userStateService.setUser(res.user);
      const savedToken = localStorage.getItem('auth_token');
        this.toastr.success('Login effettuato con successo ✅');
        this.closeAuthOverlay();
        // Reindirizza al generatore dopo il login
        this.router.navigate(['/generator']);
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

  closeAuthOverlay() {
    this.showAuthOverlay = false;
  }

  logout() {
    this.authService.logout();
    this.loggedIn = false;
    this.email = '';
    this.password = '';
    this.toastr.info('Logout effettuato 👋');
  }

  startCreating() {
    if (this.loggedIn) {
      this.router.navigate(['/generator']);
    } else {
      this.showAuthOverlay = true;
    }
  }

  private loadUserData() {
    // PRIMA controlla se abbiamo già l'user dallo state
    const cachedUser = this.userStateService.getUser();
     if (cachedUser) {
      this.user = cachedUser;
     }
    // this.authService.getCurrentUser().subscribe({
    //   next: (user) => this.user = user,
    //   error: (error) => console.error('Errore caricamento utente:', error)
    // });
  }
}











// // Metodi Avatar
// openAvatarModal() {
//   this.avatarModalOpen = true;
//   this.loadAvatars();
// }

// closeAvatarModal() {
//   this.avatarModalOpen = false;
// }

// loadAvatars() {
//   this.avatarService.getAllAvatars().subscribe({
//     next: (avatars) => {
//       this.avatars = avatars;
//       this.filteredAvatars = avatars;
//     },
//     error: (error) => {
//       console.error('Errore caricamento avatar:', error);
//       this.toastr.error('Errore nel caricamento dei personaggi');
//     }
//   });
// }

// selectAvatar(avatar: Avatar) {
//   this.selectedAvatar = avatar;
//   // Auto-applica i parametri dell'avatar
//   this.applyAvatarParameters(avatar);
// }

// applyAvatarParameters(avatar: Avatar) {
//   // Trova e aggiorna i color points con i valori dell'avatar
//   this.colorPoints.forEach(point => {
//     switch(point.parameter) {
//       case 'emotion': point.value = avatar.defaultEmotion; break;
//       case 'creativity': point.value = avatar.defaultCreativity; break;
//       case 'formality': point.value = avatar.defaultFormality; break;
//       case 'urgency': point.value = avatar.defaultUrgency; break;
//       case 'length': point.value = avatar.defaultLength; break;
//     }
//   });
// }

// clearAvatar() {
//   this.selectedAvatar = null;
//   this.showAvatarParameters = false;
// }

// confirmAvatarSelection() {
//   this.avatarModalOpen = false;
//   this.toastr.success(`Personaggio "${this.selectedAvatar?.name}" selezionato!`);
// }

// getAvatarCategories(): string[] {
//   return [...new Set(this.avatars.map(avatar => avatar.category))];
// }

// filterAvatarsByCategory(category: string) {
//   this.filteredAvatars = this.avatars.filter(avatar => avatar.category === category);
// }







// // Aggiungi queste proprietà al tuo componente
// currentSlide = 1; // Inizia dal centro
// translateValue = 0;
// slideWidth = 33.333; // Percentuale per 3 slides

// demoSlides = [
//   {
//     platform: 'Instagram',
//     platformIcon: '📸',
//     input: 'Promuovere nuovo servizio eco-friendly con consegne sostenibili',
//     output: '🌱 Le consegne che rispettano il pianeta sono arrivate! Il nostro nuovo servizio pianta un albero per ogni ordine. Unisciti alla rivoluzione verde!',
//     engagement: { likes: '2.4K', comments: '156', shares: '89' }
//   },
//   {
//     platform: 'LinkedIn',
//     platformIcon: '💼',
//     input: 'Annunciare nuova assunzione in team marketing con tono professionale',
//     output: 'Diamo il benvenuto a [Nome] nel team Marketing! La sua esperienza porterà nuova energia alla nostra vision. Il futuro è collaborativo!',
//     engagement: { likes: '356', comments: '42', shares: '18' }
//   },
//   {
//     platform: 'Twitter',
//     platformIcon: '🐦',
//     input: 'Tweet virale sul lancio feature AI nel prodotto',
//     output: 'L AI incontra la creatività! 🎨 La nostra nuova feature trasforma idee in contenuti straordinari. Rivoluziona il tuo workflow!',
//     engagement: { likes: '1.2K', comments: '243', shares: '567' }
//   },
//   {
//     platform: 'Facebook',
//     platformIcon: '👥',
//     input: 'Webinar gratuito digital marketing per piccole imprese',
//     output: '🚀 WEBINAR GRATUITO: Scopri i segreti del digital marketing che stanno rivoluzionando le PMI. Iscriviti ora!',
//     engagement: { likes: '890', comments: '67', shares: '134' }
//   },
//   {
//     platform: 'TikTok',
//     platformIcon: '🎵',
//     input: 'Video trend per promuovere app di fitness con challenge virale',
//     output: 'Ready for the #FitChallenge? 💪 Trasforma il tuo routine con la nostra app. 7 giorni, risultati incredibili! Chi si unisce?',
//     engagement: { likes: '15K', comments: '2.3K', shares: '4.5K' }
//   }
// ];

// get prevSlideIndex(): number {
//   return (this.currentSlide - 1 + this.demoSlides.length) % this.demoSlides.length;
// }

// get nextSlideIndex(): number {
//   return (this.currentSlide + 1) % this.demoSlides.length;
// }

// nextSlide() {
//   this.currentSlide = (this.currentSlide + 1) % this.demoSlides.length;
//   this.updateTranslateValue();
// }

// prevSlide() {
//   this.currentSlide = (this.currentSlide - 1 + this.demoSlides.length) % this.demoSlides.length;
//   this.updateTranslateValue();
// }

// goToSlide(index: number) {
//   this.currentSlide = index;
//   this.updateTranslateValue();
// }

// updateTranslateValue() {
//   // Calcola la traslazione per mantenere la slide attiva al centro
//   this.translateValue = -this.currentSlide * this.slideWidth;
// }


