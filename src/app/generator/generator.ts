import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/AuthService.service';
import { ToastrService } from 'ngx-toastr';
import { BrandProfile } from '../model/BrandProfile.model';
import { Testimonial } from '../model/Testimonial.model';
import { User } from '../model/User.model';
import { AvatarService } from '../services/Avatar.service';
import { BrandProfileService, ToneType } from '../services/BrandProfileService.service';
import { TestimonialService } from '../services/TestimonialService.service';
import { CreditPackageService } from '../services/CreditPackage.service';
import { Avatar } from '../model/Avatar.model';
import { Router } from '@angular/router';
import { UserStateService } from '../services/UserStateService.service';
import { Subject, takeUntil } from 'rxjs';
import { CreditStore } from "../credit-store/credit-store";

@Component({
  selector: 'app-generator',
  imports: [CommonModule, FormsModule, MatIconModule, CreditStore],
  templateUrl: './generator.html',
  styleUrl: './generator.css'
})
export class Generator implements OnInit, OnDestroy{

// ✅ VARIABILI DA SPOSTARE:
  user: User | null = null;
  inputText = '';
  output?: Testimonial;
  modalOpen = false;
  selectedKey: 'socialPost' | 'headline' | 'shortQuote' | 'callToAction' = 'socialPost';
  readonly outputKeys: ('socialPost' | 'headline' | 'shortQuote' | 'callToAction')[] = ['socialPost', 'headline', 'shortQuote', 'callToAction'];
  
  postTypes = ['testimonial', 'promozionale', 'educativo', 'storia cliente'] as const;
  selectedPostType: 'testimonial' | 'promozionale' | 'educativo' | 'storia cliente' = 'testimonial';
  platform = 'linkedin';

  // ✅ BRAND MEMORY (tutto)
  brandProfiles: BrandProfile[] = [];
  selectedBrand: BrandProfile | null = null;
  brandModalOpen = false;
  brandFormModalOpen = false;
  editingBrand: BrandProfile | null = null;

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


  tempKeyword = '';
  tempHashtag = '';
  tempAvoidedWord = '';
  tempCTA = '';

  // ✅ AVATAR (tutto)
  // avatars: Avatar[] = [];
  // selectedAvatar: Avatar | null = null;
  // avatarModalOpen = false;
  // showAvatarParameters = false;
  // filteredAvatars: Avatar[] = [];

  // ✅ CONTROL BARS (tutto)
 // Control Bars
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
  draggingPoint: any = null;
  isGenerating = false;
  
  // ✅ PLATFORM SELECTOR (tutto)
  dropdownOpen = false;
  platformOptions = [
    { value: 'linkedin', name: 'LinkedIn', icon: 'linkedin' },
    { value: 'instagram', name: 'Instagram', icon: 'photo_camera' },
    { value: 'twitter', name: 'Twitter', icon: 'flutter_dash' }
  ];

   loggedIn = false;

   // Avatar
  avatars: Avatar[] = [];
  selectedAvatar: Avatar | null = null;
  avatarModalOpen = false;
  showAvatarParameters = false;
  filteredAvatars: Avatar[] = [];


  private destroy$ = new Subject<void>();
  

  creditStoreModalOpen = false;

  constructor(
    private authService: AuthService,
    private testimonialService: TestimonialService,
    private toastr: ToastrService,
    private brandProfileService: BrandProfileService,
    private avatarService: AvatarService,
    private creditPackageService: CreditPackageService,
    private router: Router,
    private userStateService: UserStateService
  ) {}

  ngOnDestroy() {
     this.destroy$.next();
    this.destroy$.complete();
  }

    ngOnInit() {
    // Sottoscrizione ai cambiamenti dell'user
    this.userStateService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        console.log('👤 Generator - User aggiornato:', user?.email);
        
        if (user) {
          this.loadUserSpecificData();
        } else {
          this.handleNoUser();
        }
      });

    // ✅ CARICA USER INIZIALE
    this.loadInitialUser();
  }

  private loadInitialUser() {
    // 1. Prova a recuperare dallo state
    const cachedUser = this.userStateService.getUser();
    if (cachedUser) {
      console.log('✅ User dalla cache:', cachedUser.email);
      this.user = cachedUser;
      this.loadUserSpecificData();
      return;
    }
     // 2. Se c'è il token ma non l'user, carica dall'API
    if (this.authService.isLoggedIn()) {
      console.log('🔄 Token presente, carico user dall API...');
      this.authService.getCurrentUser().subscribe({
        next: (user) => {
          this.userStateService.setUser(user);
        },
        error: (error) => {
          console.error('❌ Errore caricamento user:', error);
          // Token non valido, fai logout
          this.authService.logout();
        }
      });
    } else {
      console.log('❌ Nessun user loggato');
      this.handleNoUser();
    }
  }

  private handleNoUser() {
    console.log('🔒 Nessun utente, reset stato...');
    this.user = null;
    this.inputText = '';
    this.selectedBrand = null;
    this.brandProfiles = [];
  }

private loadUserSpecificData() {
    if (!this.user) return;

    console.log('📂 Caricamento dati per utente:', this.user.email);
    
    // Carica brand profiles per QUESTO utente
    this.loadBrandProfiles();
    
    // Carica preferenze specifiche dell'utente
    const userPreferences = this.userStateService.getUserData('preferences');
    if (userPreferences) {
      this.applyUserPreferences(userPreferences);
    }
  }

  private applyUserPreferences(preferences: any) {
    console.log('⚙️ Applicando preferenze utente:', preferences);
    // Applica tema, lingua, ecc.
  }
  
   // METODO GENERATE AGGIORNATO
  generate() {

    // this.user!.credits = oldCredits - 1;
   this.isGenerating = true;

   // Se siamo in modalità guidata, usa il prompt generato automaticamente
  if (this.inputMode === 'guided') {
    this.inputText = this.generatedPrompt;
  }
    // Verifica che ci sia un input valido
  if (!this.inputText || this.inputText.trim().length === 0) {
    alert('Inserisci un contenuto o seleziona le opzioni nella modalità guidata');
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
       brandProfileId: this.selectedBrand?.id || undefined,
       // Avatar parameters
        avatarId: this.selectedAvatar?.id, // ✅ NUOVO
    avatarParameters: this.selectedAvatar ? { // ✅ NUOVO
      emotion: this.selectedAvatar.defaultEmotion,
      creativity: this.selectedAvatar.defaultCreativity,
      formality: this.selectedAvatar.defaultFormality,
      urgency: this.selectedAvatar.defaultUrgency,
      length: this.selectedAvatar.defaultLength
    } : undefined
    }).subscribe({
      next: (res) => {
        this.output = res;
        this.isGenerating = false;
         // ✅ VERIFICA FINALE (in caso di discrepanze di rete)
      this.updateUserCredits();
        this.toastr.success('Contenuto generato con successo 🎉');
      },
     error: (error) => {
       this.isGenerating = false;
      console.log("USER", this.user)
      if (error.status === 402) {
        // ✅ CREDITI ESAURITI - Mostra toast speciale
        this.showNoCreditsWarning();
        this.updateUserCredits(); // ✅ Aggiorna con valori reali dal server
      } else {
        this.toastr.error('Errore durante la generazione 😢');
      }
    }
  });
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


 // === METODI CONTROL BARS ===
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

 // === METODI PLATFORM SELECTOR ===
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

// ✅ NUOVO: Metodo per aggiornare i crediti utente
updateUserCredits() {
  // this.authService.getCurrentUser().subscribe({
  //   next: (user) => {
  //     this.user = user;

  //   },
  //   error: (error) => {
  //     console.error('Errore aggiornamento crediti:', error);
  //   }
  // });
}

// ✅ NUOVO: Metodo per mostrare avviso crediti esauriti
showNoCreditsWarning() {
  // Toast speciale con call-to-action
  this.toastr.warning(
    'Crediti esauriti! 🪙<br><br>' +
    '<button class="toast-purchase-btn" (click)="openCreditStore()">Acquista Credit</button>',
    'Crediti Insufficienti',
    {
      enableHtml: true,
      timeOut: 10000, // 10 secondi
      positionClass: 'toast-top-center',
      tapToDismiss: false
    }
  );
    // Aggiungi event listener al button nel toast
  setTimeout(() => {
    const button = document.getElementById('toast-purchase-btn');
    if (button) {
      button.onclick = () => {
        this.openCreditStore();
        this.toastr.clear();
      };
    }
  }, 100);
}

openCreditStore() {
  this.creditStoreModalOpen = true;
}

closeCreditStore() {
  this.creditStoreModalOpen = false;
}

  logout() {
    this.authService.logout();
    this.loggedIn = false;
    this.toastr.info('Logout effettuato 👋');
    this.router.navigate(['/']);
  }

// 👇 VARIABILE PER TRACCIARE COSA È STATO COPIATO
copiedIndex: number = -1;

// 👇 FUNZIONE PER COPIARE IL TESTO
copyToClipboard(text: string, event: Event, index: number) {
  event.stopPropagation(); // 👈 Impedisce la chiusura del modal
  
  navigator.clipboard.writeText(text).then(() => {
    this.copiedIndex = index;
    
    // 👇 Reset dopo 2 secondi
    setTimeout(() => {
      this.copiedIndex = -1;
    }, 2000);
  }).catch(err => {
    console.error('Errore nella copia: ', err);
    // 👇 Fallback per browser vecchi
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    this.copiedIndex = index;
    setTimeout(() => {
      this.copiedIndex = -1;
    }, 2000);
  });
}

inputMode: 'manual' | 'guided' = 'manual'; // Default a manuale

guidedInput = {
  topic: '',
  goal: '',
  keyMessage: ''
};

// 👇 METODI PER CAMBIARE MODALITÀ
switchToManualMode() {
  this.inputMode = 'manual';
  // Reset dell'input guidato se si torna al manuale
  this.guidedInput = { topic: '', goal: '', keyMessage: '' };
}

switchToGuidedMode() {
  this.inputMode = 'guided';
  // Se c'è testo nel manuale, lo puliamo
  this.inputText = '';
}

// 👇 GENERA PROMPT AUTOMATICO PER MODALITÀ GUIDATA
get generatedPrompt(): string {
  if (this.inputMode === 'manual') {
    return this.inputText;
  }
  
  const parts = [];
  
  if (this.guidedInput.topic) {
    const topicLabels = {
      'food': 'sul tema cibo e ricette',
      'fitness': 'sul tema fitness e salute',
      'tech': 'sul tema tecnologia e innovazione',
      'fashion': 'sul tema moda e beauty',
      'business': 'sul tema business e startup',
      'travel': 'sul tema viaggi e avventura',
      'lifestyle': 'sul tema lifestyle',
      'education': 'sul tema educazione e apprendimento',
      'entertainment': 'sul tema intrattenimento',
      'sports': 'sul tema sport',
      'finance': 'sul tema finanza personale'
    };
    parts.push(
      (this.guidedInput.topic in topicLabels
        ? topicLabels[this.guidedInput.topic as keyof typeof topicLabels]
        : this.guidedInput.topic)
    );
  }
  
  if (this.guidedInput.goal) {
    const goalLabels = {
      'awareness': 'con obiettivo aumentare la visibilità del brand',
      'engagement': 'con obiettivo generare like, commenti e condivisioni',
      'conversion': 'con obiettivo vendere prodotti o servizi',
      'leads': 'con obiettivo raccogliere contatti e lead',
      'community': 'con obiettivo costruire una community fedele',
      'traffic': 'con obiettivo portare traffico al sito web'
    };
    parts.push(goalLabels[this.guidedInput.goal as keyof typeof goalLabels] || this.guidedInput.goal);
  }
  
  if (this.guidedInput.keyMessage) {
    parts.push(`Dettaglio specifico: ${this.guidedInput.keyMessage}`);
  }
  
  return parts.join(' - ');
}

//  loadCreditPackages() {
//     this.creditPackageService.getActivePackages().subscribe({
//       next: (packages) => {
//         this.creditPackages = packages;
//       },
//       error: (error) => {
//         console.error('Errore caricamento pacchetti:', error);
//       }
//     });
//   }
}
