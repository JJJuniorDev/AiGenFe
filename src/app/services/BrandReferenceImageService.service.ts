// src/app/services/BrandReferenceImage.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BrandReferenceImage } from '../model/BrandReferenceImage.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BrandReferenceImageService {
  private apiUrl = `${environment.apiUrl}/brand-reference-images`;

  constructor(private http: HttpClient) {}

  // Ottieni tutte le immagini di un brand
  getImagesByBrand(brandId: string): Observable<BrandReferenceImage[]> {
    return this.http.get<BrandReferenceImage[]>(`${this.apiUrl}/brand/${brandId}`);
  }

  // Carica una nuova immagine
  uploadImage(brandId: string, imageData: FormData): Observable<BrandReferenceImage> {
    return this.http.post<BrandReferenceImage>(`${this.apiUrl}/upload/${brandId}`, imageData);
  }

  // Aggiorna un'immagine
  updateImage(imageId: string, updates: Partial<BrandReferenceImage>): Observable<BrandReferenceImage> {
    return this.http.put<BrandReferenceImage>(`${this.apiUrl}/${imageId}`, updates);
  }

  // Elimina un'immagine
  deleteImage(imageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${imageId}`);
  }

  // Analizza l'immagine per estrarre caratteristiche
  analyzeImage(imageId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${imageId}/analyze`, {});
  }
}