import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
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
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { CreditStore } from "../credit-store/credit-store";
import { TranslationService } from '../services/TranslationService.service';
import { SocialCraftService } from '../services/SocialCraftService.service';
import { PostSalvato } from '../model/PostSalvato.model';
import { ContentAssistantComponent } from "../content-assistant-component/content-assistant-component";
import { environment } from '../../environments/environment';
import { GeneratedImage, ImageGenerationRequest, ImageService, SaveImageRequest } from '../services/ImageService.service';

@Component({
  selector: 'app-generator',
  imports: [CommonModule, FormsModule, MatIconModule, CreditStore, ContentAssistantComponent],
  templateUrl: './generator.html',
  styleUrl: './generator.css'
})
export class Generator implements OnInit, OnDestroy{

// ✅ VARIABILI DA SPOSTARE:
  user: User | null = null;
  inputText = '';
  output?: Testimonial;
  modalOpen = false;
   // ✅ CORREGGI: Definisci un tipo union esplicito
  selectedKey: keyof Testimonial = 'socialPostVersions';
  readonly outputKeys: (keyof Testimonial)[] = [
    'socialPostVersions', 
    'headlineVersions', 
    'shortQuoteVersions', 
    'callToActionVersions'
  ];

 postTypes = [
  { valueIt: 'promozionale', valueEn: 'promotional', displayIt: 'promozionale', displayEn: 'promotional' },
  { valueIt: 'testimonial', valueEn: 'testimonial', displayIt: 'testimonial', displayEn: 'testimonial' },
  { valueIt: 'educativo', valueEn: 'educational', displayIt: 'educativo', displayEn: 'educational' },
  { valueIt: 'storia cliente', valueEn: 'customer_story', displayIt: 'storia cliente', displayEn: 'customer story' }
] as const;
postTypeOptions: any[] = [];

selectedPostType: string = 'promozionale';
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
      name: 'emotion', // 👈 USA CHIAVE DI TRADUZIONE
      color: '#EF4444',
      value: 50,
      parameter: 'emotion'
    },
    { 
      id: 2, 
      name: 'creativity',
      color: '#8B5CF6',
      value: 50,
      parameter: 'creativity'
    },
    { 
      id: 3, 
      name: 'formality',
      color: '#3B82F6',
      value: 50,
      parameter: 'formality'
    },
    { 
      id: 4, 
      name: 'urgency',
      color: '#F59E0B',
      value: 50,
      parameter: 'urgency'
    },
    { 
      id: 5, 
      name: 'length',
      color: '#10B981',
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
  maxBrands: number = 3; // Default
  currentBrands: number = 0;
  canCreateMoreBrands: boolean = true;

  private destroy$ = new Subject<void>();
  

  creditStoreModalOpen = false;
  
currentLang: 'it' | 'en' = 'it';

websiteAnalysisModalOpen = false;
websiteUrl = '';
analyzingWebsite = false;
private isLoadingBrands = false;
  private brandsLoaded = false;
private previousUserId: string | null = null;

  
  // Variabili per gestione immagini
  generatedImages: GeneratedImage[] = [];
  generatingImages = false;
  savingImages = false;
  imagesToSave: Set<string> = new Set(); 



  imagesForPost: { [postIndex: number]: GeneratedImage[] } = {};
  currentImageIndex: { [postIndex: number]: number } = {};
  generatingImagesForPost: number | null = null;
  constructor(
    private authService: AuthService,
    private testimonialService: TestimonialService,
    private toastr: ToastrService,
    private brandProfileService: BrandProfileService,
    private avatarService: AvatarService,
    private creditPackageService: CreditPackageService,
    private router: Router,
    private userStateService: UserStateService,
    public translationService: TranslationService,
    private socialCraftService: SocialCraftService,
    private cdr: ChangeDetectorRef,
    private imageService: ImageService
  ) {
    
    }
  

  ngOnDestroy() {
     this.destroy$.next();
    this.destroy$.complete();
  }


    ngOnInit() {
     
       this.translationService.currentLang$
    .pipe(takeUntil(this.destroy$))
    .subscribe(lang => {
      this.currentLang = lang;
       this.updatePostTypeOptions();
    });
      this.currentLang = this.translationService.getCurrentLanguage();
       // ✅ VERIFICA DOPPIA: CLIENT + SERVER
  if (!this.authService.isLoggedIn()) {
    this.authService.logout();
    return;
  }
   
   this.loadInitialUser();
   }


    // 👇 AGGIUNGI QUESTO METODO
  updateBrandCreationStatus() {
    this.canCreateMoreBrands = this.currentBrands < this.maxBrands;
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
          this.maxBrands = user.maxBrands || 3;
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
    this.brandsLoaded = false; // ✅ IMPORTANTE
  this.isLoadingBrands = false; // ✅ IMPORTANTE
  this.previousUserId = null; // ✅ IMPORTANTE
  }

private loadUserSpecificData() {
    if (!this.user) return;

    console.log('📂 Caricamento dati per utente:', this.user.email);
    
    
      if (this.user.id !== this.previousUserId) {
    this.brandsLoaded = false;
    this.previousUserId = this.user.id;
    this.loadBrandProfiles();
  }
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
if (this.isGenerating || this.generationStatus === 'queued') {
    console.log('⏸️ Generazione già in corso...');
    return;
  }
      // Reset errori
  this.showBrandError = false;
  this.showManualWarning = false;
  this.showTopicError = false;
  this.showGoalError = false;

  // Validazione 1: Brand
  if (!this.selectedBrand) {
    this.showBrandError = true;
    this.showNotification(
      '🚫 Seleziona un brand prima di generare il contenuto!', 
      'error', 
      5000
    );
    return;
  }

  // Validazione 2: Contenuto in base alla modalità
  if (this.inputMode === 'manual') {
    if (!this.inputText || this.inputText.trim().length < 10) {
      this.showManualWarning = true;
      this.showNotification(
        '📝 Inserisci almeno 10 caratteri di descrizione nella modalità manuale', 
        'warning', 
        4000
      );
      return;
    }
  } else if (this.inputMode === 'guided') {
    // Validazione per modalità guidata
    if (!this.guidedInput.topic) {
      this.showTopicError = true;
      this.showNotification(
        '🎯 Seleziona un argomento principale', 
        'warning', 
        3000
      );
      return;
    }
    
    if (!this.guidedInput.goal) {
      this.showGoalError = true;
      this.showNotification(
        '🎯 Seleziona un obiettivo per il post', 
        'warning', 
        3000
      );
      return;
    }
  }

  // Validazione 3: Crediti
  if (this.user && this.user.credits < 1) {
    this.showNotification(
      '💳 Crediti insufficienti! Acquista crediti per generare contenuti.', 
      'error', 
      5000
    );
    this.openCreditStore();
    return;
  }
    // this.user!.credits = oldCredits - 1;
   this.isGenerating = true;
 this.generationStatus = 'processing';
   // Se siamo in modalità guidata, usa il prompt generato automaticamente
  if (this.inputMode === 'guided') {
    this.inputText = this._generatedPrompt;
  }
    
    this.testimonialService.generate({
      inputText: this.inputText,
      platform: this.platform,
      selectedPostType: this.getPostTypeValue(),
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
      length: this.selectedAvatar.defaultLength,
    } : undefined,
     language: this.currentLang
    }).subscribe({
      next: (res) => {
        this.output = res;
        this.isGenerating = false;
        this.generationStatus = 'completed';
         // ✅ VERIFICA FINALE (in caso di discrepanze di rete)
      this.updateUserCredits();
        this.toastr.success('Contenuto generato con successo 🎉');
          if (this.user && this.user.credits >= 1) {
    this.user.credits = this.user.credits - 1;
  }
      },
     error: (error) => {
       this.isGenerating = false;
       this.generationStatus = 'error';
        // ✅ GESTIONE ERRORI SPECIFICI
      if (error.status === 429) {
        // SERVIZIO OCCUPATO - MOSTRA STATO DI CODA
        this.generationStatus = 'queued';
        this.queuePosition = error.error?.queue_position || 1;
        this.estimatedWaitTime = error.error?.retry_after || 30;
        
        this.showNotification(
          `⏳ Servizio occupato. Posizione in coda: ${this.queuePosition}. ` +
          `Tempo stimato: ${this.estimatedWaitTime}s`, 
          'warning', 
          10000
        );
       // ✅ PROVA AUTOMATICA DOPO IL TIMEOUT
        setTimeout(() => {
          if (this.generationStatus === 'queued') {
            this.retryGeneration();
          }
        }, this.estimatedWaitTime * 1000);
        
      } else if (error.status === 402) {
        // CREDITI ESAURITI
        this.generationStatus = 'error';
        this.showNoCreditsWarning();
        this.updateUserCredits();
        this.ngOnInit();
      } else {
        // ALTRI ERRORI
        this.generationStatus = 'error';
        this.toastr.error('Errore durante la generazione 😢');
      }
    }
  });
}


// ✅ NUOVO: METODO PER RITENTARE AUTOMATICAMENTE
retryGeneration() {
  console.log('🔄 Tentativo di generazione automatica...');
  this.generationStatus = 'processing';
  this.generate(); // Richiama il metodo generate originale
}

// ✅ NUOVO: METODO PER CANCELLARE LA CODA
cancelGeneration() {
  this.generationStatus = 'idle';
  this.isGenerating = false;
  this.queuePosition = 0;
  this.estimatedWaitTime = 0;
  this.toastr.info('Generazione cancellata');
}

  // Apri modal con la card cliccata
  openModal(key: keyof Testimonial) {
    this.selectedKey = key;
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
  }

  // Formatta il titolo della card
  formatTitle(key: keyof Testimonial): string {
    const titles: { [key in keyof Testimonial]?: string } = {
      'socialPostVersions': 'Social Post',
      'headlineVersions': 'Headline', 
      'shortQuoteVersions': 'Short Quote',
      'callToActionVersions': 'Call to Action'
    };
    return titles[key] || key.toString();
  }

  get selectedVersions(): string[] {
    if (!this.output) return [];
    return this.output[this.selectedKey] as string[];
  }



  // Apri modale selezione brand
  openBrandModal() {
    this.brandModalOpen = true;
       if (!this.brandsLoaded && !this.isLoadingBrands && this.brandProfiles.length === 0) {
    this.loadBrandProfiles();
  }
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
      if (this.isLoadingBrands || this.brandsLoaded || !this.user) {
      return;
    }
     this.isLoadingBrands = true;
    this.brandProfileService.getUserBrandProfiles().subscribe({
      next: (profiles) => {
        this.brandProfiles = profiles;
         this.currentBrands = profiles.length;
           this.updateBrandCreationStatus(); 
           this.brandsLoaded = true;
        this.isLoadingBrands = false;
        // this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Errore caricamento brand profiles:', error);
        this.toastr.error('Errore nel caricamento dei brand');
        this.isLoadingBrands = false;
         this.brandsLoaded = false;
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
      if (!brand && !this.canCreateMoreBrands) {
        this.toastr.error(
      `Limite brand raggiunto! Hai ${this.currentBrands} brand su ${this.maxBrands} disponibili.`,
      'Limite Raggiunto'
    );
    return;
  }
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
           this.currentBrands = this.brandProfiles.length;
          this.toastr.success('Brand creato con successo!');
        }
        this.closeBrandModal();
      },
      error: (error) => {
         if (error.message && error.message.includes('Limite brand raggiunto')) {
        this.toastr.error(error.message, 'Limite Raggiunto');
      } else {
        this.toastr.error('Errore nel salvataggio del brand');
      }
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

getToneOptions(): { value: string, label: string }[] {
  const toneOptions = [
    { value: 'FORMALE_PROFESSIONALE', it: 'Formale Professionale', en: 'Formal Professional' },
    { value: 'CASUALE_FRIENDLY', it: 'Casuale e Friendly', en: 'Casual and Friendly' },
    { value: 'ENTUSIASTA_ENERGETICO', it: 'Entusiasta ed Energetico', en: 'Enthusiastic and Energetic' },
    { value: 'TECNICO_DETTAGLIATO', it: 'Tecnico e Dettagliato', en: 'Technical and Detailed' },
    { value: 'MOTIVAZIONALE_ISPIRAZIONE', it: 'Motivazionale e Ispirazionale', en: 'Motivational and Inspirational' },
    { value: 'UMORISMO_SCHERZO', it: 'Umoristico e Scherzoso', en: 'Humorous and Playful' },
    { value: 'LUSSUOSO_SOFISTICATO', it: 'Lussuoso e Sofisticato', en: 'Luxurious and Sophisticated' },
    { value: 'EDUCATIVO_INFORMATIVO', it: 'Educativo e Informativo', en: 'Educational and Informative' }
  ];

  return toneOptions.map(option => ({
    value: option.value,
    label: option[this.currentLang]
  }));
}

getToneLabel(tone: string): string {
  const labels: { [key: string]: { it: string, en: string } } = {
    'FORMALE_PROFESSIONALE': { 
      it: 'Formale Professionale', 
      en: 'Formal Professional' 
    },
    'CASUALE_FRIENDLY': { 
      it: 'Casuale e Friendly', 
      en: 'Casual and Friendly' 
    },
    'ENTUSIASTA_ENERGETICO': { 
      it: 'Entusiasta ed Energetico', 
      en: 'Enthusiastic and Energetic' 
    },
    'TECNICO_DETTAGLIATO': { 
      it: 'Tecnico e Dettagliato', 
      en: 'Technical and Detailed' 
    },
    'MOTIVAZIONALE_ISPIRAZIONE': { 
      it: 'Motivazionale e Ispirazionale', 
      en: 'Motivational and Inspirational' 
    },
    'UMORISMO_SCHERZO': { 
      it: 'Umoristico e Scherzoso', 
      en: 'Humorous and Playful' 
    },
    'LUSSUOSO_SOFISTICATO': { 
      it: 'Lussuoso e Sofisticato', 
      en: 'Luxurious and Sophisticated' 
    },
    'EDUCATIVO_INFORMATIVO': { 
      it: 'Educativo e Informativo', 
      en: 'Educational and Informative' 
    }
  };
  
  const label = labels[tone];
  return label ? label[this.currentLang] : tone;
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
   this.authService.getCurrentUser().subscribe({
    next: (user) => {
      this.user = user;
      this.userStateService.setUser(user); // Aggiorna anche lo state
    },
    error: (error) => {
      console.error('Errore aggiornamento crediti:', error);
    }
  });
  // this.authService.getCurrentUser().subscribe({
  //   next: (user) => {
  //     this.user = user;

  //   },
  //   error: (error) => {
  //     console.error('Errore aggiornamento crediti:', error);
  //   }
  // });
  //QUI
  //  this.authService.getCurrentUser().subscribe({
  //   next: (user) => {
  //     this.user = user;
  //     this.userStateService.setUser(user); // Aggiorna anche lo state
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
   this.updateGeneratedPrompt();
}

switchToGuidedMode() {
  this.inputMode = 'guided';
  // Se c'è testo nel manuale, lo puliamo
  this.inputText = '';
   this.updateGeneratedPrompt();
}



    // 👇 METODO PER CAMBIARE LINGUA
  toggleLanguage() {
    const newLang = this.currentLang === 'it' ? 'en' : 'it';
    
    this.currentLang = newLang;
    this.translationService.setLanguage(newLang);
    this.updatePostTypeOptions();
  }

  private _generatedPrompt: string = '';

  get generatedPrompt(): string {
  return this._generatedPrompt;
}

  // 👇 MODIFICA IL GETTER generatedPrompt
  private updateGeneratedPrompt() {
    if (this.inputMode === 'manual') {
      this._generatedPrompt = this.inputText;
       return;
    }
    
    const parts = [];
    
    if (this.guidedInput.topic) {
      // Per i topic, usa traduzioni condizionali
      const topicTranslations: {[key: string]: {it: string, en: string}} = {
        'food': { it: '🍕 Cibo & Ricette', en: '🍕 Food & Recipes' },
        'fitness': { it: '💪 Fitness & Salute', en: '💪 Fitness & Health' },
        'tech': { it: '💻 Tecnologia', en: '💻 Technology' },
        'fashion': { it: '👗 Moda & Beauty', en: '👗 Fashion & Beauty' },
        'business': { it: '💼 Business & Startup', en: '💼 Business & Startup' },
        'travel': { it: '✈️ Viaggi & Avventura', en: '✈️ Travel & Adventure' },
        'lifestyle': { it: '🏡 Lifestyle', en: '🏡 Lifestyle' },
        'education': { it: '🎓 Educazione', en: '🎓 Education' },
        'entertainment': { it: '🎬 Intrattenimento', en: '🎬 Entertainment' },
        'sports': { it: '⚽ Sport', en: '⚽ Sports' },
        'finance': { it: '💰 Finanza Personale', en: '💰 Personal Finance' }
      };
      
      const topic = topicTranslations[this.guidedInput.topic];
      parts.push(topic ? topic[this.currentLang] : this.guidedInput.topic);
    }
    
    if (this.guidedInput.goal) {
      // Per i goal, usa traduzioni condizionali
      const goalTranslations: {[key: string]: {it: string, en: string}} = {
        'awareness': { it: '👀 Aumentare visibilità', en: '👀 Increase visibility' },
        'engagement': { it: '💬 Generare like/commenti', en: '💬 Generate likes/comments' },
        'conversion': { it: '🛒 Vendere prodotti/servizi', en: '🛒 Sell products/services' },
        'leads': { it: '📩 Raccolta contatti', en: '📩 Collect contacts' },
        'community': { it: '👥 Costruire community', en: '👥 Build community' },
        'traffic': { it: '🌐 Portare traffico al sito', en: '🌐 Drive website traffic' }
      };
      
      const goal = goalTranslations[this.guidedInput.goal];
      parts.push(goal ? goal[this.currentLang] : this.guidedInput.goal);
    }
    
    if (this.guidedInput.keyMessage) {
      parts.push(this.currentLang === 'it' 
        ? `Dettaglio specifico: ${this.guidedInput.keyMessage}`
        : `Specific detail: ${this.guidedInput.keyMessage}`
      );
    }
    
     this._generatedPrompt = parts.join(' - ');
  }

 getTranslatedParamName(point: any): string {
    return this.translationService.translate(point.name);
  }

  getPostTypeOptions(): any[] {
  return this.postTypes.map(type => ({
    value: this.currentLang === 'it' ? type.valueIt : type.valueEn,
    display: this.currentLang === 'it' ? type.displayIt : type.displayEn
  }));
}

  // AGGIUNGI QUESTO METODO PER OTTENERE IL VALORE CORRETTO IN BASE ALLA LINGUA
getPostTypeValue(): string {
  const type = this.postTypes.find(p => 
    this.currentLang === 'it' ? p.valueIt === this.selectedPostType : p.valueEn === this.selectedPostType
  );
  
  if (!type) return this.selectedPostType;
  
  return this.currentLang === 'it' ? type.valueIt : type.valueEn;
}

// AGGIUNGI QUESTO METODO PER OTTENERE LA VISUALIZZAZIONE TRADOTTA:
getTranslatedPostType(postType: string): string {
  const type = this.postTypes.find(p => 
    this.currentLang === 'it' ? p.valueIt === postType : p.valueEn === postType
  );
  return type ? type[this.currentLang === 'it' ? 'displayIt' : 'displayEn'] : postType;
}

// Aggiungi queste proprietà alla classe del componente
notification: any = null;
private notificationTimeout: any;
showBrandError: boolean = false;
showManualWarning: boolean = false;
showTopicError: boolean = false;
showGoalError: boolean = false;


// Metodo per mostrare notifiche
showNotification(message: string, type: 'error' | 'warning' | 'success' = 'error', duration: number = 5000) {
  this.notification = { message, type };
  
  // Auto-dismiss dopo la durata
  clearTimeout(this.notificationTimeout);
  this.notificationTimeout = setTimeout(() => {
    this.dismissNotification();
  }, duration);
}

// Metodo per chiudere la notifica
dismissNotification() {
  this.notification = null;
  clearTimeout(this.notificationTimeout);
}



 openArchive() {
  console.log('🔄 Navigazione a archive...');
  this.router.navigate(['/archive']).then(success => {
    console.log('✅ Navigazione riuscita:', success);
  }).catch(error => {
    console.error('❌ Errore navigazione:', error);
  });
}


// Metodo helper per mappare le chiavi ai tipi
getTipoFromKey(key: string): string {
  const tipoMap: { [key: string]: string } = {
    'postIdeas': 'social_post',
    'ctaVariations': 'cta', 
    'hashtagSuggestions': 'short_quote',
    'captionOptions': 'headline'
    // Aggiungi altri mapping secondo le tue esigenze
  };
  
  return tipoMap[key] || key;
}
// Metodo per salvare i post
savePost(contenuto: string, key: string) {
  const tipo = this.getTipoFromKey(key);
  
  const postData: PostSalvato = {
    contenuto: contenuto,
    tipo: tipo,
    piattaforma: this.platform,
    categoria: this.selectedPostType,
    brandId: this.selectedBrand?.id,
    brandName: this.selectedBrand?.brandName,
     userId: this.user?.id
  };

  this.socialCraftService.salvaPost(postData).subscribe({
    next: (response) => {
      this.showNotification('✅ Contenuto salvato in archivio!', 'success', 2000);
    },
    error: (error) => {
      console.error('Errore salvataggio:', error);
      this.showNotification('❌ Errore nel salvataggio', 'error', 3000);
    }
  });
}


getOutputValue(key: keyof Testimonial): string[] {
  if (!this.output) return [];
  return this.output[key] as string[];
}


// ✅ AGGIUNGI QUESTE PROPRIETÀ AL COMPONENTE
generationStatus: 'idle' | 'queued' | 'processing' | 'completed' | 'error' = 'idle';
queuePosition: number = 0;
estimatedWaitTime: number = 0;

// 👇 METODO PER APRIRE MODALE ANALISI
openWebsiteAnalysisModal() {
  this.websiteAnalysisModalOpen = true;
  this.websiteUrl = '';
}

// 👇 METODO PER ANALIZZARE SITO
analyzeWebsite() {
  if (!this.websiteUrl.trim()) {
    this.showNotification('Inserisci un URL del sito web', 'warning', 3000);
    return;
  }

  this.analyzingWebsite = true;

  this.brandProfileService.analyzeWebsite(this.websiteUrl, this.currentLang).subscribe({
    next: (brandProfile) => {
      this.analyzingWebsite = false;
      this.websiteAnalysisModalOpen = false;
      
      // Seleziona automaticamente il brand creato
      this.selectedBrand = brandProfile;
      this.brandProfiles.push(brandProfile);
      this.currentBrands = this.brandProfiles.length;
      this.updateBrandCreationStatus();
      
      this.showNotification(
        `✅ Brand "${brandProfile.brandName}" creato automaticamente dal sito web!`, 
        'success', 
        5000
      );
    },
    error: (error) => {
      this.analyzingWebsite = false;
      this.showNotification(
        '❌ Impossibile analizzare il sito web. Controlla l\'URL e riprova.', 
        'error', 
        5000
      );
    }
  });
}







assistantModalOpen = false;



closeContentAssistant() {
  this.assistantModalOpen = false;
 
}

onSuggestionApplied(updatedContent: string) {
  this.inputText = updatedContent;
}

contentToOptimize: string = '';
optimizationType: string = '';
isOptimizing: boolean = false;

// ✅ METODO PER OTTIMIZZARE CONTENUTO GENERATO
optimizeContent(content: string, contentType: string = '') {
  // Salva il contenuto da ottimizzare
  this.contentToOptimize = content;
  this.optimizationType = contentType;
  
  // Pre-carica l'assistant con il contenuto
  setTimeout(() => {
    this.openContentAssistant(this.contentToOptimize);
  }, 100);
}

// ✅ METODO MODIFICATO PER APRIRE L'ASSISTANT
openContentAssistant(version: string) {
  this.assistantModalOpen = true;
 if (version.trim() !== '') {
    this.contentToOptimize = version;
  }
  // Se c'è contenuto da ottimizzare, lo pre-carica nell'assistant
  if (this.contentToOptimize) {
    // Usiamo un timeout per assicurarci che il componente assistant sia renderizzato
    setTimeout(() => {
      this.prefillAssistantContent();
    }, 200);
  }
}

// ✅ METODO PER PRE-CARICARE CONTENUTO NELL'ASSISTANT
private prefillAssistantContent() {
  const assistantComponent = document.querySelector('app-content-assistant-component');
  if (assistantComponent && this.contentToOptimize) {
    // Accedi al componente assistant e imposta il contenuto
    // Nota: Questo è un workaround - in un'implementazione ideale useresti un servizio condiviso
    const textarea = assistantComponent.querySelector('textarea');
    if (textarea) {
      (textarea as HTMLTextAreaElement).value = this.contentToOptimize;
      // Trigger il change detection
      textarea.dispatchEvent(new Event('input'));
    }
  }
}

// ✅ METODO PER RESETTARE L'OTTIMIZZAZIONE
resetOptimization() {
  this.contentToOptimize = '';
  this.optimizationType = '';
  this.isOptimizing = false;
}


onGuidedInputChange() {
  this.updateGeneratedPrompt();
}

// Metodo per aggiornare le opzioni quando cambia la lingua
updatePostTypeOptions() {
  this.postTypeOptions = this.postTypes.map(type => ({
    value: this.currentLang === 'it' ? type.valueIt : type.valueEn,
    display: this.currentLang === 'it' ? type.displayIt : type.displayEn
  }));
}
generateImageForPost(postContent: string, postIndex: number) {
  if (!this.selectedBrand) {
    this.showNotification('Seleziona un brand prima di generare immagini!', 'warning');
    return;
  }

  // Verifica crediti
  if (this.user && this.user.credits < 0.5) {
    this.showNotification('Crediti insufficienti! Servono 0.5 crediti', 'error');
    this.openCreditStore();
    return;
  }

  this.generatingImagesForPost = postIndex;

  const request: ImageGenerationRequest = {
    posts: [postContent], // Solo questo post
    platform: this.platform,
    brandProfileId: this.selectedBrand.id!,
    brandName: this.selectedBrand.brandName,
    style: 'realistic',
    includeText: true,
  };

  this.imageService.generateImages(request).subscribe({
    next: (response) => {
      this.generatingImagesForPost = null;
      
      if (!this.imagesForPost[postIndex]) {
        this.imagesForPost[postIndex] = [];
      }
      
      // Aggiungi nuove immagini con flag temporaneo
      const newImages = response.images.map((img, index) => ({
        ...img,
        temporaryId: img.temporaryId || `temp_${Date.now()}_${postIndex}_${index}`,
        savedToCloudinary: img.savedToCloudinary || false,
        postIndex: postIndex // Memorizza a quale post appartiene
      }));
      
      this.imagesForPost[postIndex].push(...newImages);
      
      // Imposta l'indice corrente sull'ultima immagine aggiunta
      this.currentImageIndex[postIndex] = this.imagesForPost[postIndex].length - 1;
      
      if (this.user) {
        this.user.credits -= response.totalCost || 0.5;
      }

      this.showNotification(
        `🎨 Immagine generata! (-${response.totalCost || 0.5} crediti)`,
        'success'
      );
    },
    error: (error) => {
      this.generatingImagesForPost = null;
      console.error('Errore generazione immagine:', error);
      
      if (error.status === 402) {
        this.showNotification('Crediti insufficienti per generare immagini!', 'error');
        this.openCreditStore();
      } else {
        this.showNotification(error.error?.error || 'Errore nella generazione dell\'immagine', 'error');
      }
    }
  });
}


  // 🔥 METODO AGGIORNATO: Genera immagini con Base64
 generateAnotherImageForPost(postContent: string, postIndex: number) {
  this.generateImageForPost(postContent, postIndex);
}

    prevImage(postIndex: number) {
  if (!this.imagesForPost[postIndex] || this.imagesForPost[postIndex].length <= 1) return;
  
  this.currentImageIndex[postIndex] = 
    this.currentImageIndex[postIndex] === 0 
      ? this.imagesForPost[postIndex].length - 1 
      : this.currentImageIndex[postIndex] - 1;
}

nextImage(postIndex: number) {
  if (!this.imagesForPost[postIndex] || this.imagesForPost[postIndex].length <= 1) return;
  
  this.currentImageIndex[postIndex] = 
    this.currentImageIndex[postIndex] === this.imagesForPost[postIndex].length - 1 
      ? 0 
      : this.currentImageIndex[postIndex] + 1;
}

goToImage(postIndex: number, imageIndex: number) {
  if (this.imagesForPost[postIndex] && imageIndex < this.imagesForPost[postIndex].length) {
    this.currentImageIndex[postIndex] = imageIndex;
  }
}

// 🔄 Aggiungi metodo per eliminare immagine:
deleteImageFromPost(postIndex: number, imageIndex: number) {
  if (this.imagesForPost[postIndex] && this.imagesForPost[postIndex][imageIndex]) {
    const image = this.imagesForPost[postIndex][imageIndex];
    
    // Se l'immagine è salvata su Cloudinary, puoi anche eliminarla dal server
    if (image.imageUrl && !image.imageBase64) {
      // Opzionale: chiama API per eliminare da Cloudinary
      this.imageService.deleteImage(image.imageUrl).subscribe({
        next: () => {
          console.log('Immagine eliminata da Cloudinary');
        },
        error: (err) => {
          console.warn('Impossibile eliminare da Cloudinary:', err);
        }
      });
    }
    
    // Rimuovi dall'array
    this.imagesForPost[postIndex].splice(imageIndex, 1);
    
    // Aggiorna l'indice corrente
    if (this.currentImageIndex[postIndex] >= this.imagesForPost[postIndex].length) {
      this.currentImageIndex[postIndex] = Math.max(0, this.imagesForPost[postIndex].length - 1);
    }
    
    this.showNotification('Immagine rimossa');
  }
}

  // 🔥 NUOVO: Ottieni sorgente immagine (Base64 o URL)
  getImageSource(image: GeneratedImage): string {
    if (image.imageBase64) {
      return 'data:image/png;base64,' + image.imageBase64;
    }
    return image.imageUrl || '';
  }

  // 🔥 NUOVO: Controlla se l'immagine è temporanea (Base64)
  isTemporaryImage(image: GeneratedImage): boolean {
    return !image.savedToCloudinary && !!image.imageBase64;
  }

 

  // 🔥 NUOVO: Salva immagine su Cloudinary
  saveImage(image: GeneratedImage) {
    if (!image.imageBase64) return;
    
    this.savingImages = true;
    this.imagesToSave.add(image.temporaryId || '');
    
    const request: SaveImageRequest = {
      imageBase64: image.imageBase64,
      platform: image.platform,
      brandName: this.selectedBrand?.brandName
    };
    
    this.imageService.saveImage(request).subscribe({
      next: (savedImage) => {
        // Aggiorna l'immagine con l'URL Cloudinary
        const index = this.generatedImages.findIndex(img => 
          img.temporaryId === image.temporaryId
        );
        
        if (index !== -1) {
          this.generatedImages[index] = {
            ...savedImage,
            temporaryId: image.temporaryId,
            savedToCloudinary: true
          };
        }
        
        this.imagesToSave.delete(image.temporaryId || '');
        this.savingImages = this.imagesToSave.size > 0;
        
        this.showNotification('✅ Immagine salvata su Cloudinary!', 'success');
      },
      error: (error) => {
        this.imagesToSave.delete(image.temporaryId || '');
        this.savingImages = this.imagesToSave.size > 0;
        
        this.showNotification('❌ Errore nel salvataggio: ' + error.error?.error, 'error');
      }
    });
  }
  
  // 🔥 NUOVO: Salva tutte le immagini non salvate
  saveAllImages() {
    const unsavedImages = this.generatedImages.filter(img => 
      this.isTemporaryImage(img)
    );
    
    if (unsavedImages.length === 0) return;
    
    unsavedImages.forEach(image => {
      this.saveImage(image);
    });
  }
  
  // 🔥 NUOVO: Copia contenuto immagine (URL o Base64)
  copyImageContent(image: GeneratedImage) {
    const content = image.imageUrl || image.imageBase64 || '';
    navigator.clipboard.writeText(content).then(() => {
      this.showNotification('📋 ' + (image.imageUrl ? 'URL copiato!' : 'Base64 copiato!'), 'success', 2000);
    });
  }
  
  // 🔥 AGGIORNATO: Download gestisce sia URL che Base64
  downloadImage(image: GeneratedImage) {
    if (image.imageUrl) {
      // Download da URL Cloudinary
      const link = document.createElement('a');
      link.href = image.imageUrl;
      link.download = `${this.selectedBrand?.brandName || 'social'}-${image.platform}-${Date.now()}.png`;
      link.click();
    } else if (image.imageBase64) {
      // Download da Base64
      const link = document.createElement('a');
      link.href = 'data:image/png;base64,' + image.imageBase64;
      link.download = `${this.selectedBrand?.brandName || 'social'}-${image.platform}-${Date.now()}.png`;
      link.click();
    }
  }


 

  // 🔥 NUOVO: Gestisci errore immagine
  handleImageError(event: any, image: GeneratedImage) {
    console.error('Errore caricamento immagine:', image.temporaryId);
    event.target.src = 'assets/placeholder-image.png'; // Aggiungi un placeholder
  }
  
  // 🔥 METODO PER COPIARE URL IMMAGINE (compatibilità)
  async copyImageUrl(imageUrl: string) {
    try {
      await this.imageService.copyImageUrl(imageUrl);
      this.showNotification('📋 URL immagine copiato!', 'success', 2000);
    } catch (error) {
      this.showNotification('Errore nella copia', 'error');
    }
  }

get temporaryImagesCount(): number {
    return this.generatedImages.filter(img => this.isTemporaryImage(img)).length;
  }
  
  // 🔥 GETTER: Immagini temporanee
  get temporaryImages(): GeneratedImage[] {
    return this.generatedImages.filter(img => this.isTemporaryImage(img));
  }
 get savedImages(): GeneratedImage[] {
    return this.generatedImages.filter(img => !this.isTemporaryImage(img));
  }
  
  // 🔥 METODO: Controlla se ci sono immagini non salvate
  get hasUnsavedImages(): boolean {
    return this.temporaryImagesCount > 0;
  }
}