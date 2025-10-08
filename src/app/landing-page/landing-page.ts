import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Testimonial } from '../model/Testimonial.model';
import { AuthService } from '../services/AuthService.service';
import { TestimonialService } from '../services/TestimonialService.service';
import { ToastrService } from 'ngx-toastr';
import { BrandProfile } from '../model/BrandProfile.model';
import { BrandProfileService, ToneType } from '../services/BrandProfileService.service';

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
    colorPalette: ''
  };

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

  onPaletteMouseDown(event: MouseEvent) {
    if (!this.selectedPoint) return;
    this.isDragging = true;
  }

  onPaletteMouseMove(event: MouseEvent) {
    if (!this.isDragging || !this.selectedPoint) return;
    this.dragPoint(event.clientX, event.clientY);
  }

  onPaletteMouseUp() {
    this.isDragging = false;
    this.selectedPoint = null;
  }

  // METODI PER TOUCH (MANCANTI - AGGIUNGI QUESTI)
  onPaletteTouchStart(event: TouchEvent) {
    event.preventDefault();
    // Se clicchi direttamente su un punto, selectPoint viene chiamato
  }

  onPaletteTouchMove(event: TouchEvent) {
    if (!this.isDragging || !this.selectedPoint) return;
    const touch = event.touches[0];
    this.dragPoint(touch.clientX, touch.clientY);
  }

  onPaletteTouchEnd() {
    this.isDragging = false;
    this.selectedPoint = null;
  }

  // METODO DRAG CONDIVISO
  dragPoint(clientX: number, clientY: number) {
    const palette = document.querySelector('.color-palette') as HTMLElement;
    if (!palette) return;

    const rect = palette.getBoundingClientRect();
    
    // Calcola posizione percentuale
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    // Limita ai bordi
    const clampedX = Math.max(5, Math.min(95, x));
    const clampedY = Math.max(5, Math.min(95, y));
    
    // Aggiorna posizione
    this.selectedPoint.x = clampedX;
    this.selectedPoint.y = clampedY;
    
    // Calcola valore basato sulla posizione (Y = intensità)
    this.selectedPoint.value = 100 - Math.round(clampedY);
  }

  // METODO GENERATE AGGIORNATO
  generate() {
    this.testimonialService.generate({
      inputText: this.inputText,
      platform: this.platform,
      postType: this.selectedPostType,
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
      defaultHashtags: [],
      visualStyle: '',
      colorPalette: ''
    };
    this.tempKeyword = '';
    this.tempHashtag = '';
    this.tempAvoidedWord = '';
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
}

