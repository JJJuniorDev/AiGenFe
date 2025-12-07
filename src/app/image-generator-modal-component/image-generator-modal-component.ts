// src/app/components/image-generator-modal/image-generator-modal.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrandReferenceImage } from '../model/BrandReferenceImage.model';
import { BrandProfile } from '../model/BrandProfile.model';
import { BrandReferenceImageService } from '../services/BrandReferenceImageService.service';
import { ImageGenerationRequest, ImageService } from '../services/ImageService.service';

@Component({
  selector: 'app-image-generator-modal',
  imports: [CommonModule, FormsModule],
 templateUrl: './image-generator-modal-component.html',
  styleUrls: ['./image-generator-modal-component.css']
})
export class ImageGeneratorModalComponent implements OnInit {
  @Input() selectedBrand: BrandProfile | null = null;
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() imagesGenerated = new EventEmitter<any[]>();

  // Immagini di riferimento
  referenceImages: BrandReferenceImage[] = [];
  selectedReferenceImages: BrandReferenceImage[] = [];
  
  // Upload
  uploadProgress = 0;
  isUploading = false;
  
  // Generazione
  generationPrompt = '';
  selectedStyle: 'realistic' | 'illustrative' | 'minimal' | 'vibrant' = 'realistic';
  numberOfImages = 4;
  aspectRatio: '1:1' | '4:5' | '16:9' = '1:1';
  isGenerating = false;

  // File upload
  selectedFiles: File[] = [];

  constructor(
    private referenceImageService: BrandReferenceImageService,
    private imageService: ImageService
  ) {}

  ngOnInit() {
    if (this.selectedBrand?.id) {
      this.loadReferenceImages();
    }
  }

  // METODI PER GESTIONE FILE UPLOAD
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.selectedBrand?.id) return;

    const files = Array.from(input.files);
    this.handleFilesUpload(files);
  }

  handleDrop(event: DragEvent) {
    event.preventDefault();
    if (!event.dataTransfer?.files.length || !this.selectedBrand?.id) return;

    const files = Array.from(event.dataTransfer.files);
    this.handleFilesUpload(files);
  }

  private handleFilesUpload(files: File[]) {
    // Filtra solo immagini
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      console.error('Nessuna immagine valida selezionata');
      return;
    }

    // Limita a 5 file per volta
    const filesToUpload = imageFiles.slice(0, 5);
    this.selectedFiles = filesToUpload;
    
    // Upload dei file
    this.uploadFiles(filesToUpload);
  }

  private uploadFiles(files: File[]) {
    if (!this.selectedBrand?.id) return;

    this.isUploading = true;
    this.uploadProgress = 0;
    
    const totalFiles = files.length;
    let uploadedCount = 0;

    files.forEach((file, index) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('brandId', this.selectedBrand!.id!.toString());
      formData.append('brandName', this.selectedBrand!.brandName);
      formData.append('description', `Immagine di riferimento per ${this.selectedBrand?.brandName}`);
      formData.append('fileName', file.name);

      this.referenceImageService.uploadImage(this.selectedBrand!.id!, formData)
        .subscribe({
          next: (uploadedImage) => {
            this.referenceImages.push(uploadedImage);
            uploadedCount++;
            
            // Aggiorna progresso
            this.uploadProgress = Math.round((uploadedCount / totalFiles) * 100);
            
            // Se tutti i file sono stati caricati
            if (uploadedCount === totalFiles) {
              this.isUploading = false;
              this.selectedFiles = [];
            }
          },
          error: (error) => {
            console.error(`Errore upload file ${file.name}:`, error);
            uploadedCount++;
            
            if (uploadedCount === totalFiles) {
              this.isUploading = false;
              this.selectedFiles = [];
            }
          }
        });
    });
  }

  loadReferenceImages() {
    if (!this.selectedBrand?.id) return;
    
    this.referenceImageService.getImagesByBrand(this.selectedBrand.id)
      .subscribe({
        next: (images) => {
          this.referenceImages = images;
        },
        error: (error) => {
          console.error('Errore caricamento immagini:', error);
        }
      });
  }

  // GENERAZIONE IMMAGINI
  generateImages() {
    if (!this.selectedBrand?.id || !this.generationPrompt.trim()) return;

    // Costruisci il prompt combinato con informazioni del brand
    const enhancedPrompt = this.buildEnhancedPrompt();
    
    const request: ImageGenerationRequest = {
      prompt: enhancedPrompt,
      brandProfileId: this.selectedBrand.id,
      brandName: this.selectedBrand.brandName,
      style: this.selectedStyle,
      numberOfImages: this.numberOfImages,
      aspectRatio: this.aspectRatio,
      referenceImageUrls: this.selectedReferenceImages.map(img => img.imageUrl)
    };

    this.isGenerating = true;

    this.imageService.generateImages(request).subscribe({
      next: (response) => {
        this.isGenerating = false;
        this.imagesGenerated.emit(response.images);
        
        // Reset dei campi dopo la generazione
        this.generationPrompt = '';
        this.selectedReferenceImages = [];
        
        // Chiudi il modale dopo la generazione
        this.close();
      },
      error: (error) => {
        console.error('Errore generazione:', error);
        this.isGenerating = false;
      }
    });
  }

  private buildEnhancedPrompt(): string {
    let prompt = this.generationPrompt;
    
    // Aggiungi informazioni del brand al prompt
    if (this.selectedBrand) {
      const brandInfo = [];
      
      if (this.selectedBrand.brandDescription) {
        brandInfo.push(`Brand: ${this.selectedBrand.brandDescription}`);
      }
      
      if (this.selectedBrand.tone) {
        brandInfo.push(`Tono: ${this.selectedBrand.tone}`);
      }
      
      if (this.selectedBrand.brandValues) {
        brandInfo.push(`Valori: ${this.selectedBrand.brandValues}`);
      }
      
      if (this.selectedBrand.targetAudience) {
        brandInfo.push(`Target: ${this.selectedBrand.targetAudience}`);
      }
      
      if (brandInfo.length > 0) {
        prompt = `${prompt}. Contesto brand: ${brandInfo.join(', ')}`;
      }
    }
    
    // Aggiungi stile specificato
    switch (this.selectedStyle) {
      case 'realistic':
        prompt += ' Fotorealistico, dettagliato, professional photography';
        break;
      case 'illustrative':
        prompt += ' Illustrazione, artistico, flat design, vector art';
        break;
      case 'minimal':
        prompt += ' Minimalista, pulito, semplice, whitespace';
        break;
      case 'vibrant':
        prompt += ' Colori vibranti, bold, eye-catching, saturated';
        break;
    }
    
    return prompt;
  }

  // GESTIONE SELEZIONE IMMAGINI
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

  // METODI UI
  close() {
    // Reset dello stato prima di chiudere
    this.selectedReferenceImages = [];
    this.generationPrompt = '';
    this.selectedFiles = [];
    this.isUploading = false;
    this.isGenerating = false;
    
    this.closeModal.emit();
  }

  // METODI PER GESTIONE DRAG & DROP
  handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }
}