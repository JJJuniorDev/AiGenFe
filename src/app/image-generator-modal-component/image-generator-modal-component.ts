import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrandReferenceImage } from '../model/BrandReferenceImage.model';
import { BrandProfile } from '../model/BrandProfile.model';
import { BrandReferenceImageService } from '../services/BrandReferenceImageService.service';
import { GeneratedImage, ImageGenerationRequest, ImageService, SaveImageRequest } from '../services/ImageService.service';
import { AuthService } from '../services/AuthService.service';
import { UserStateService } from '../services/UserStateService.service';

@Component({
  selector: 'app-image-generator-modal',
  imports: [CommonModule, FormsModule],
   templateUrl: './image-generator-modal-component.html',
  styleUrls: ['./image-generator-modal-component.css']
})
export class ImageGeneratorModalComponent implements OnInit {
  @Input() selectedBrand: BrandProfile | null = null;
  @Input() isOpen = false;
  @Input() user: any = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() imagesGenerated = new EventEmitter<GeneratedImage[]>();
@Output() userUpdated = new EventEmitter<any>();

  referenceImages: BrandReferenceImage[] = [];
  selectedReferenceImages: BrandReferenceImage[] = [];
  
  generationPrompt = '';
  selectedStyle: string = 'cinematic';
  aspectRatio: '1:1' | '4:5' | '16:9' | '9:16' = '1:1';
  isGenerating = false;
  isEditing = false;
  isSaving = false;
  
  editPrompt = '';
  generatedImages: GeneratedImage[] = [];
  selectedImageForEditing: GeneratedImage | null = null;
  previewLoaded = false;

  availableStyles = [
    { value: '3d-model', label: 'Modello 3D' },
    { value: 'analog-film', label: 'Pellicola Analogica' },
    { value: 'anime', label: 'Anime' },
    { value: 'cinematic', label: 'Cinematico' },
    { value: 'comic-book', label: 'Fumetto' },
    { value: 'digital-art', label: 'Arte Digitale' },
    { value: 'enhance', label: 'Migliorato' },
    { value: 'fantasy-art', label: 'Arte Fantasy' },
    { value: 'isometric', label: 'Isometrico' },
    { value: 'line-art', label: 'Line Art' },
    { value: 'low-poly', label: 'Low Poly' },
    { value: 'modeling-compound', label: 'Modellato' },
    { value: 'neon-punk', label: 'Neon Punk' },
    { value: 'origami', label: 'Origami' },
    { value: 'photographic', label: 'Fotografico' },
    { value: 'pixel-art', label: 'Pixel Art' },
    { value: 'tile-texture', label: 'Texture a Piastrelle' }
  ];

  constructor(
    private referenceImageService: BrandReferenceImageService,
    private imageService: ImageService,
    private authService: AuthService,
    private userStateService: UserStateService
  ) {}

  ngOnInit() {
    if (this.selectedBrand?.id) {
      this.loadReferenceImages();
    }
  }

  // Caricamento immagini di riferimento
  loadReferenceImages() {
    if (!this.selectedBrand?.id) return;
    
    this.referenceImageService.getImagesByBrand(this.selectedBrand.id)
      .subscribe({
        next: (images) => this.referenceImages = images,
        error: (error) => console.error('Errore caricamento immagini:', error)
      });
  }

  toggleImageSelection(image: BrandReferenceImage) {
    const index = this.selectedReferenceImages.findIndex(img => img.id === image.id);
    if (index === -1) {
      this.selectedReferenceImages.push(image);
    } else {
      this.selectedReferenceImages.splice(index, 1);
    }
  }

  isImageSelected(image: BrandReferenceImage): boolean {
    return this.selectedReferenceImages.some(img => img.id === image.id);
  }

  // Generazione immagine
  generateSingleImage() {
    if (!this.generationPrompt.trim()) {
      alert('Inserisci un prompt');
      return;
    }

     if (this.user && this.user.credits < 1) {
    this.showNotification(
      '💳 Crediti insufficienti! Acquista crediti per generare contenuti.', 
      'error', 
      5000
    );
    return;
  }

    this.isGenerating = true;

    const request: ImageGenerationRequest = {
      prompt: this.generationPrompt,
      brandName: this.selectedBrand?.brandName || '',
      platform: this.mapAspectRatioToPlatform(this.aspectRatio),
      style: this.selectedStyle,
      referenceImageUrls: this.selectedReferenceImages.map(img => img.imageUrl)
    };

    this.imageService.generateSingleImage(request).subscribe({
      next: (image: GeneratedImage) => {
        this.isGenerating = false;
        this.generatedImages.push(image);
        this.selectImageForEditing(image);
        this.imagesGenerated.emit([image]);
         this.updateUserCredits();
    console.log('USER: '+this.user);
       if (this.user && this.user.credits >= 1) {
    this.user.credits = this.user.credits - 1;
  }
      },
      error: (error) => {
        console.error('Errore generazione:', error);
        this.isGenerating = false;
      }
    });
   
  }

  private mapAspectRatioToPlatform(aspectRatio: string): string {
    switch (aspectRatio) {
      case '1:1': return 'instagram';
      case '4:5': return 'instagram';
      case '9:16': return 'instagram';
      case '16:9': return 'linkedin';
      default: return 'instagram';
    }
  }

  // Modifica immagine
  selectImageForEditing(image: GeneratedImage) {
    this.previewLoaded = false;
    this.selectedImageForEditing = image;
    this.editPrompt = image.promptUsed || '';
  }

  editSelectedImage() {
    if (!this.selectedImageForEditing || !this.editPrompt.trim()) return;

    this.isEditing = true;
    const editStrength = this.determineEditStrength(this.editPrompt);

    this.imageService.editImage(
      this.selectedImageForEditing.imageBase64!,
      this.editPrompt,
      '',
      this.aspectRatio,
      this.selectedStyle,
      this.selectedImageForEditing.editCount || 0,
      editStrength
    ).subscribe({
      next: (editedImage: GeneratedImage) => {
        this.isEditing = false;
        this.generatedImages.push(editedImage);
        this.selectImageForEditing(editedImage);
        this.imagesGenerated.emit(this.generatedImages);
      },
      error: (error) => {
        console.error('Errore durante la modifica:', error);
        this.isEditing = false;
      }
    });
  }

  // Salvataggio e download
  saveImageToCloudinary(image: GeneratedImage) {
    if (!image.imageBase64) return;

    this.isSaving = true;

    const saveRequest: SaveImageRequest = {
      imageBase64: image.imageBase64,
      platform: image.platform,
      brandName: this.selectedBrand?.brandName
    };

    this.imageService.saveImage(saveRequest).subscribe({
      next: (savedImage) => {
        this.isSaving = false;
        
        const index = this.generatedImages.findIndex(img => 
          img.temporaryId === image.temporaryId
        );
        
        if (index !== -1) {
          this.generatedImages[index] = {
            ...this.generatedImages[index],
            imageUrl: savedImage.imageUrl,
            savedToCloudinary: true
          };
        }
      },
      error: (error) => {
        console.error('Errore salvataggio:', error);
        this.isSaving = false;
      }
    });
  }

  downloadImage(image: GeneratedImage) {
    if (!image.imageBase64) return;
    
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${image.imageBase64}`;
    const fileName = `${this.selectedBrand?.brandName || 'image'}-${Date.now()}.png`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async copyImageUrl(imageUrl: string) {
    try {
      await navigator.clipboard.writeText(imageUrl);
    } catch (err) {
      console.error('Errore copia URL:', err);
    }
  }

  // UI Methods
  close() {
    this.selectedReferenceImages = [];
    this.generationPrompt = '';
    this.isGenerating = false;
    this.isEditing = false;
    this.isSaving = false;
    this.editPrompt = '';
    this.selectedImageForEditing = null;
    this.closeModal.emit();
  }

  onImageLoaded() {
    this.previewLoaded = true;
  }

  getVersionNumber(image: GeneratedImage): number {
    if (!image.editCount) return 1;
    return image.editCount + 1;
  }

  private determineEditStrength(prompt: string): number {
    const promptLower = prompt.toLowerCase();
    
    const radicalKeywords = [
      'aggiungi', 'rimuovi', 'cambia', 'trasforma', 'completamente',
      'totalmente', 'invece', 'diverso', 'nuovo', 'crea', 'trasforma in', 'metti'
    ];

    const subtleKeywords = [
      'migliora', 'migliora leggermente', 'ritocca', 'aggiusta',
      'leggermente', 'un po\'', 'piccolo', 'minimo', 'rifinisci'
    ];

    let radicalCount = 0;
    let subtleCount = 0;

    radicalKeywords.forEach(keyword => {
      if (promptLower.includes(keyword)) radicalCount++;
    });
    
    subtleKeywords.forEach(keyword => {
      if (promptLower.includes(keyword)) subtleCount++;
    });
    
    if (radicalCount > 0 && radicalCount >= subtleCount) {
      return 0.15; // Modifica forte
    } else if (subtleCount > radicalCount) {
      return 0.65; // Modifica sottile
    }
    
    return 0.35; // Default
  }

  notification: any = null;
  private notificationTimeout: any;
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


updateUserCredits() {
   this.authService.getCurrentUser().subscribe({
    next: (user) => {
      this.user = user;
      this.userStateService.setUser(user); // Aggiorna anche lo state
     this.userUpdated.emit(user);
    },
    error: (error) => {
      console.error('Errore aggiornamento crediti:', error);
    }
  });
}
}