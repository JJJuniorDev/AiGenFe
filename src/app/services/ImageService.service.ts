// services/ImageService.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ImageGenerationRequest {
  posts: string[]; // Array di contenuti testuali
  platform: string;
  brandProfileId?: string;
  brandName?: string;
  style?: 'realistic' | 'illustrative' | 'minimal' | 'vibrant';
  includeText?: boolean;
  language?: 'it' | 'en';
}

export interface GeneratedImage {
  imageUrl: string;
  thumbnailUrl?: string;
  platform: string;
  dimensions: {
    width: number;
    height: number;
  };
  estimatedCost?: number;
  generatedAt: Date;
  postContent?: string; // Post usato come base
   promptUsed?: string; // Prompt AI usato
}

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private baseUrl = `${environment.apiUrl}/images`;

  constructor(private http: HttpClient
  ) {}

  generateImages(request: ImageGenerationRequest): Observable<{images: GeneratedImage[]}> {
    return this.http.post<{images: GeneratedImage[]}>(`${this.baseUrl}/generate/batch`, request);
  }

    generateSingleImage(postContent: string, platform: string, brandName: string): Observable<GeneratedImage> {
    const request = {
      content: postContent,
      platform: platform,
      brandName: brandName,
      includeText: true
    };
    
    return this.http.post<GeneratedImage>(`${this.baseUrl}/generate`, request);
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
}