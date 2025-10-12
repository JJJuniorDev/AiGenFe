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

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './landing-page.html',
  styleUrls: ['./landing-page.css']
})
export class LandingPageComponent implements OnInit {
  user: User | null = null;
  // Login / Sign-up
  email = '';
  password = '';
  loggedIn = false;
platform = 'linkedin';

  // Testimonial generation
  inputText = '';
  output?: Testimonial;
modalOpen = false;
  selectedKey: 'socialPost' | 'headline' | 'shortQuote' | 'callToAction' = 'socialPost';
readonly outputKeys: ('socialPost' | 'headline' | 'shortQuote' | 'callToAction')[] = ['socialPost', 'headline', 'shortQuote', 'callToAction'];
  
postTypes = ['testimonial', 'promozionale', 'educativo', 'storia cliente'] as const;
selectedPostType: 'testimonial' | 'promozionale' | 'educativo' | 'storia cliente' = 'testimonial';
showAuthOverlay = false;

// Tono come slider (0 = neutro, 100 = massimo emozionale/rabbia)
toneValue = 50;

// Stile come slider (0 = semplice, 100 = super creativo)
styleValue = 50;

// ✅ NUOVE VARIABILI BRAND MEMORY
  brandProfiles: BrandProfile[] = [];
  selectedBrand: BrandProfile | null = null;
  
  // Modali
  brandModalOpen = false;
  brandFormModalOpen = false;
  editingBrand: BrandProfile | null = null;
  
  // Form nuovo brand
  newBrand: BrandProfile = {
    brandName: '',
    tone: ToneType.FORMALE_PROFESSIONALE,
    preferredKeywords: [],
    avoidedWords: [],
    brandDescription: '',
    targetAudience: '',
    brandValues: '',
    tagline: '',
    defaultHashtags: [],
    visualStyle: '',
    colorPalette: '',
    preferredCTAs: []
  };

  tempCTA: string = '';

constructor(private authService: AuthService,
              private testimonialService: TestimonialService,
            private toastr: ToastrService,
          private brandProfileService: BrandProfileService) {}

  // Autenticazione
  login() {
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: res => {
        this.authService.saveToken(res.token);
        this.loggedIn = true;
        this.user= res.user;
         // ✅ AZZERA E RICARICA I BRAND DEL NUOVO UTENTE
      this.brandProfiles = [];
      this.selectedBrand = null;
      this.loadBrandProfiles(); // Carica i brand del nuovo utente
        this.toastr.success('Login effettuato con successo ✅');
      },
      error: () => this.toastr.error('Email o password errate ❌')
    });
  }


ngOnInit() {
  this.loggedIn = this.authService.isLoggedIn();
   // ✅ Se l'utente è loggato, carica i suoi brand
  if (this.loggedIn) {
    this.loadBrandProfiles();
  } else {
    // ✅ Se non è loggato, assicurati che i brand siano azzerati
    this.brandProfiles = [];
    this.selectedBrand = null;
  }
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
    // ✅ Se non è loggato, assicurati che i brand siano azzerati
  if (!this.loggedIn) {
    this.brandProfiles = [];
    this.selectedBrand = null;
  }
}

  logout() {
    this.authService.logout();
    this.loggedIn = false;
    this.email = '';
    this.password = '';
    this.output = undefined;
     // ✅ AZZERA I BRAND DELL'UTENTE PRECEDENTE
  this.brandProfiles = [];
  this.selectedBrand = null;
  this.brandModalOpen = false;
  this.brandFormModalOpen = false;
  this.editingBrand = null;
  this.resetBrandForm();
    this.toastr.info('Logout effettuato 👋');
  }

  // Apri modal con la card cliccata
  openModal(key: 'socialPost' | 'headline' | 'shortQuote' | 'callToAction') {
    this.selectedKey = key;
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
  }

  // Formatta il titolo della card
  formatTitle(key: 'socialPost' | 'headline' | 'shortQuote' | 'callToAction'): string {
    return key === 'socialPost' ? 'Social Post'
         : key === 'headline' ? 'Headline'
         : key === 'callToAction' ? 'Call to Action'
         : 'Short Quote';
  }

  get selectedVersions(): string[] {
  if (!this.output) return [];
  switch (this.selectedKey) {
    case 'socialPost': return this.output.socialPostVersions;
    case 'headline': return this.output.headlineVersions;
    case 'shortQuote': return this.output.shortQuoteVersions;
    case 'callToAction': return this.output.callToActionVersions;
  }
}











  // PALETTA PRINCIPALE - 5 PUNTI DI CONTROLLO
  colorPoints = [
    { 
      id: 1, 
      name: 'Tono Emotivo',
      color: '#EF4444',
      x: 20, 
      y: 80,
      value: 50,
      parameter: 'emotion'
    },
    { 
      id: 2, 
      name: 'Creatività',
      color: '#8B5CF6',
      x: 40, 
      y: 30,
      value: 50,
      parameter: 'creativity'
    },
    { 
      id: 3, 
      name: 'Formalità',
      color: '#3B82F6',
      x: 60, 
      y: 60,
      value: 50,
      parameter: 'formality'
    },
    { 
      id: 4, 
      name: 'Urgenza',
      color: '#F59E0B',
      x: 70, 
      y: 20,
      value: 50,
      parameter: 'urgency'
    },
    { 
      id: 5, 
      name: 'Lunghezza',
      color: '#10B981',
      x: 85, 
      y: 70,
      value: 50,
      parameter: 'length'
    }
  ];

  selectedPoint: any = null;
  isDragging = false;

  // METODI PER MOUSE
  selectPoint(event: MouseEvent | TouchEvent, point: any) {
    event.stopPropagation();
    event.preventDefault();
    this.selectedPoint = point;
    this.isDragging = true;
  }


  // METODO GENERATE AGGIORNATO
  generate() {
     if (!this.loggedIn) {
    this.showAuthOverlay = true;
    return;
  }
    this.testimonialService.generate({
      inputText: this.inputText,
      platform: this.platform,
      selectedPostType: this.selectedPostType,
      // Mappa i punti colore ai parametri
      emotion: this.colorPoints.find(p => p.parameter === 'emotion')?.value || 50,
      creativity: this.colorPoints.find(p => p.parameter === 'creativity')?.value || 50,
      formality: this.colorPoints.find(p => p.parameter === 'formality')?.value || 50,
      urgency: this.colorPoints.find(p => p.parameter === 'urgency')?.value || 50,
      length: this.colorPoints.find(p => p.parameter === 'length')?.value || 50,
       brandProfileId: this.selectedBrand?.id || undefined
    }).subscribe({
      next: (res) => {
        this.output = res;
        this.toastr.success('Contenuto generato con successo 🎉');
      },
      error: () => this.toastr.error('Errore durante la generazione 😢')
    });
  }

// ✅ METODI BRAND MEMORY
   // Input temporanei per keywords/hashtags
  tempKeyword = '';
  tempHashtag = '';
  tempAvoidedWord = '';

  // Apri modale selezione brand
  openBrandModal() {
     // ✅ Controlla che l'utente sia loggato prima di aprire il modal
  if (!this.loggedIn) {
    this.showAuthOverlay = true;
    return;
  }
    this.brandModalOpen = true;
    this.loadBrandProfiles();
  }

  // Chiudi modale
  closeBrandModal() {
    this.brandModalOpen = false;
    this.brandFormModalOpen = false;
    this.editingBrand = null;
    this.resetBrandForm();
  }

  // Carica brand profiles
  loadBrandProfiles() {
    this.brandProfileService.getUserBrandProfiles().subscribe({
      next: (profiles) => {
        this.brandProfiles = profiles;
      },
      error: (error) => {
        console.error('Errore caricamento brand profiles:', error);
        this.toastr.error('Errore nel caricamento dei brand');
      }
    });
  }

  // Seleziona/deseleziona brand
  toggleBrandSelection(brand: BrandProfile) {
    if (this.selectedBrand?.id === brand.id) {
      this.selectedBrand = null;
    } else {
      this.selectedBrand = brand;
    }
  }

  // Conferma selezione brand
  confirmBrandSelection() {
    this.brandModalOpen = false;
    this.toastr.success(`Brand "${this.selectedBrand?.brandName}" selezionato!`);
  }

  // Apri modale creazione/modifica brand
  openBrandFormModal(brand?: BrandProfile) {
    if (brand) {
      // Modifica brand esistente
      this.editingBrand = brand;
      this.newBrand = { ...brand };
    } else {
      // Crea nuovo brand
      this.editingBrand = null;
      this.resetBrandForm();
    }
    this.brandFormModalOpen = true;
  }

  // Aggiungi questi metodi
addCTA() {
  if (this.tempCTA && this.tempCTA.trim() !== '') {
    if (!this.newBrand.preferredCTAs) {
      this.newBrand.preferredCTAs = [];
    }
    this.newBrand.preferredCTAs.push(this.tempCTA.trim());
    this.tempCTA = '';
  }
}

removeCTA(index: number) {
  this.newBrand.preferredCTAs.splice(index, 1);
}

  // Reset form brand
  resetBrandForm() {
    this.newBrand = {
      brandName: '',
      tone: ToneType.FORMALE_PROFESSIONALE,
      preferredKeywords: [],
      avoidedWords: [],
      brandDescription: '',
      targetAudience: '',
      brandValues: '',
      tagline: '',
      positioning: '',
    preferredCTAs: [],
      defaultHashtags: [],
      visualStyle: '',
      colorPalette: ''
    };
    this.tempKeyword = '';
    this.tempHashtag = '';
    this.tempAvoidedWord = '';
    this.tempCTA = '';
  }

  // Aggiungi keyword
  addKeyword() {
    if (this.tempKeyword.trim()) {
      this.newBrand.preferredKeywords.push(this.tempKeyword.trim());
      this.tempKeyword = '';
    }
  }

  // Rimuovi keyword
  removeKeyword(index: number) {
    this.newBrand.preferredKeywords.splice(index, 1);
  }

  // Aggiungi hashtag
  addHashtag() {
    if (this.tempHashtag.trim()) {
      let hashtag = this.tempHashtag.trim();
      if (!hashtag.startsWith('#')) {
        hashtag = '#' + hashtag;
      }
      this.newBrand.defaultHashtags.push(hashtag);
      this.tempHashtag = '';
    }
  }

  // Rimuovi hashtag
  removeHashtag(index: number) {
    this.newBrand.defaultHashtags.splice(index, 1);
  }

  // Aggiungi parola da evitare
  addAvoidedWord() {
    if (this.tempAvoidedWord.trim()) {
      this.newBrand.avoidedWords.push(this.tempAvoidedWord.trim());
      this.tempAvoidedWord = '';
    }
  }

  // Rimuovi parola da evitare
  removeAvoidedWord(index: number) {
    this.newBrand.avoidedWords.splice(index, 1);
  }

  // Salva brand (creazione o modifica)
  saveBrand() {
    if (!this.newBrand.brandName.trim()) {
      this.toastr.error('Il nome del brand è obbligatorio');
      return;
    }

    const operation = this.editingBrand 
      ? this.brandProfileService.updateBrandProfile(this.editingBrand.id!, this.newBrand)
      : this.brandProfileService.createBrandProfile(this.newBrand);

    operation.subscribe({
      next: (savedBrand) => {
        if (this.editingBrand) {
          // Aggiorna lista
          const index = this.brandProfiles.findIndex(b => b.id === this.editingBrand!.id);
          if (index !== -1) {
            this.brandProfiles[index] = savedBrand;
          }
          this.toastr.success('Brand aggiornato con successo!');
        } else {
          // Aggiungi alla lista
          this.brandProfiles.push(savedBrand);
          this.toastr.success('Brand creato con successo!');
        }
        this.closeBrandModal();
      },
      error: () => {
        this.toastr.error('Errore nel salvataggio del brand');
      }
    });
  }

  // Elimina brand
  deleteBrand(brand: BrandProfile) {
    if (confirm(`Sei sicuro di voler eliminare il brand "${brand.brandName}"?`)) {
      this.brandProfileService.deleteBrandProfile(brand.id!).subscribe({
        next: () => {
          this.brandProfiles = this.brandProfiles.filter(b => b.id !== brand.id);
          if (this.selectedBrand?.id === brand.id) {
            this.selectedBrand = null;
          }
          this.toastr.success('Brand eliminato con successo');
        },
        error: () => {
          this.toastr.error('Errore nell\'eliminazione del brand');
        }
      });
    }
  }
  // Metodi helper per i toni
getToneOptions(): string[] {
  return Object.values(ToneType);
}

getToneLabel(tone: string): string {
  const labels: { [key: string]: string } = {
    'FORMALE_PROFESSIONALE': 'Formale Professionale',
    'CASUALE_FRIENDLY': 'Casuale e Friendly',
    'ENTUSIASTA_ENERGETICO': 'Entusiasta ed Energetico',
    'TECNICO_DETTAGLIATO': 'Tecnico e Dettagliato',
    'MOTIVAZIONALE_ISPIRAZIONE': 'Motivazionale e Ispirazionale',
    'UMORISMO_SCHERZO': 'Umoristico e Scherzoso',
    'LUSSUOSO_SOFISTICATO': 'Lussuoso e Sofisticato',
    'EDUCATIVO_INFORMATIVO': 'Educativo e Informativo'
  };
  return labels[tone] || tone;
}












draggingPoint: any = null;

startDrag(point: any, event: MouseEvent) {
  this.draggingPoint = point;
  this.updateBarValue(event);
}

onDrag(event: MouseEvent) {
  if (!this.draggingPoint) return;
  this.updateBarValue(event);
}

stopDrag() {
  this.draggingPoint = null;
}

// --- Touch support ---
startTouch(point: any, event: TouchEvent) {
  event.preventDefault();
  this.draggingPoint = point;
  this.updateBarValue(event.touches[0]);
}

onTouchMove(event: TouchEvent) {
  if (!this.draggingPoint) return;
  this.updateBarValue(event.touches[0]);
}

// --- Calcolo percentuale ---
updateBarValue(event: MouseEvent | Touch) {
  if (!this.draggingPoint) return;

  // Ottieni il target dell'evento (l'elemento cliccato/toccato)
  const target = (event as any).target as HTMLElement;
  const barElement = target.closest('.bar-item') as HTMLElement;
  if (!barElement) return;

  // Coordinate corrette (supporta anche touch)
  const clientY = event instanceof MouseEvent ? event.clientY : event.clientY ?? 0;

  const rect = barElement.getBoundingClientRect();
  const relativeY = (clientY - rect.top) / rect.height;

  // Inverti: 0 in basso → 100 in alto
  const value = 100 - Math.round(relativeY * 100);

  // Clamp (0–100)
  this.draggingPoint.value = Math.max(0, Math.min(100, value));
}











  dropdownOpen = false;

platformOptions = [
    { value: 'linkedin', name: 'LinkedIn', icon: 'linkedin' },
    { value: 'instagram', name: 'Instagram', icon: 'photo_camera' },
    { value: 'twitter', name: 'Twitter', icon: 'flutter_dash' }
  ];

  selectPlatform(value: string) {
    this.platform = value;
    this.dropdownOpen = false;
  }

  getPlatformIcon(platform: string): string {
    const option = this.platformOptions.find(p => p.value === platform);
    return option ? option.icon : 'link';
  }

  getPlatformName(platform: string): string {
    const option = this.platformOptions.find(p => p.value === platform);
    return option ? option.name : 'Seleziona';
  }
}

