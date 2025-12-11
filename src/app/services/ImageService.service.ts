// services/ImageService.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ImageGenerationRequest {
  prompt?: string;
  brandProfileId?: string;
  brandName?: string;
  style?: string;
  includeText?: boolean;
  numberOfImages?: number;
  aspectRatio?: '1:1' | '4:5' | '16:9';
  referenceImageUrls?: string[]; // Array di URL immagini di riferimento
  platform?: string;
  baseImage?: string; // Base64 dell'immagine da modificare
  editCount?: number;
  imageStrength?: number;
}

export interface SocialImageBatchRequest {
  posts: string[]; // Array di prompt
  brandName: string;
  platform: string;
  style?: string;
}

export interface GeneratedImage {
  imageUrl?: string;          // URL Cloudinary (solo se salvata)
  imageBase64?: string;// Base64 per anteprima immediata
  thumbnailUrl?: string;
  platform: string;
  dimensions: {
    width: number;
    height: number;
  };
  generatedAt: Date;
  postContent?: string; // Post usato come base
   promptUsed?: string; // Prompt AI usato
    savedToCloudinary?: boolean; // Flag per indicare se è stato fatto upload
  temporaryId?: string;
  isEdit: boolean;
  editCount?: number;
}

export interface BatchGenerationResponse {
  images: GeneratedImage[];
  count: number;
  totalCost: number;
}

export interface SaveImageRequest {
  imageBase64: string;
  platform: string;
  brandName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  
 
  private baseUrl = `${environment.apiUrl}/images`;

  constructor(private http: HttpClient
  ) {}

 
  generateImages(request: ImageGenerationRequest): Observable<BatchGenerationResponse> {
     const batchRequest: SocialImageBatchRequest = {
      posts: [request.prompt ?? ''], // Crea array di prompt
      brandName: request.brandName || '',
      platform: '1:1',
      style: 'cinematic'
    };
     return this.http.post<BatchGenerationResponse>(
      `${this.baseUrl}/generate/batch`, 
      batchRequest
    );
  }

 generateSingleImage(request: ImageGenerationRequest): Observable<GeneratedImage> {
    console.log('📤 Invio richiesta singola:', request);
    
    return this.http.post<GeneratedImage>(`${this.baseUrl}/generate`, request);
  }

   saveImage(request: SaveImageRequest): Observable<GeneratedImage> {
    return this.http.post<GeneratedImage>(`${this.baseUrl}/save`, request);
  }

  downloadImage(imageUrl: string, fileName: string = 'social-image'): void {
  // Usa l'URL Cloudinary direttamente
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${fileName}-${Date.now()}.png`;
    link.click();
  }

  copyImageUrl(imageUrl: string): Promise<void> {
    return navigator.clipboard.writeText(imageUrl);
  }

    // 🔥 METODO PER OTTENERE THUMBNAIL (dimensioni ridotte)
  getThumbnailUrl(imageUrl: string, width: number = 400): string {
    if (!imageUrl.includes('cloudinary.com')) {
      return imageUrl;
    }
       return imageUrl.replace('/upload/', `/upload/w_${width},c_fill/`);
  }


    private createMultiplePrompts(request: ImageGenerationRequest): string[] {
    const numberOfImages = request.numberOfImages || 1;
    const prompts: string[] = [];
    
    // Se ci sono immagini di riferimento, includi il riferimento nel prompt
    const referenceContext = request.referenceImageUrls && request.referenceImageUrls.length > 0 
      ? `, inspired by reference images with similar style and composition`
      : '';
    
    // Crea variazioni del prompt per ogni immagine
    for (let i = 0; i < numberOfImages; i++) {
      let prompt = request.prompt;
      
      // Aggiungi variazioni per diversità
      if (i > 0) {
        const variations = [
          'different angle',
          'alternative composition',
          'variation',
          'another perspective'
        ];
        const variation = variations[i % variations.length];
        prompt = `${prompt}, ${variation}`;
      }
      
      prompts.push(prompt + referenceContext);
    }
    
    return prompts;
  }


   editImage(
    baseImage: string,
    prompt: string,
    brandName: string,
    aspectRatio: string = '1:1',
    style: string = 'cinematic',
    editCount: number = 0,
    imageStrength?: number
  ): Observable<GeneratedImage> {
    const request: ImageGenerationRequest = {
      prompt: prompt,
      brandName: brandName,
      platform: this.mapAspectRatioToPlatform(aspectRatio),
      style: style,
      baseImage: baseImage,
      editCount: editCount,
      imageStrength: imageStrength || 0.35
    };
    
    return this.generateSingleImage(request);
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

    private mapStyleToBackend(style: string): string {
    const styleMap: { [key: string]: string } = {
      'photographic': 'photographic',
      'cinematic': 'cinematic',
      'minimal': 'minimalist',
      'vibrant': 'vibrant'
    };
    return styleMap[style] || 'cinematic';
  }
}