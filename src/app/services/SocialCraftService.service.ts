import { Observable } from "rxjs";
import { PostSalvato } from "../model/PostSalvato.model";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AuthService } from "./AuthService.service";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class SocialCraftService {
  private apiUrl = 'http://localhost:8080/api'; // Modifica con il tuo URL backend

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Metodi per i post salvati
  salvaPost(postData: PostSalvato): Observable<PostSalvato> {
    return this.http.post<PostSalvato>(
      `${this.apiUrl}/posts-salvati`, 
      postData, 
      { headers: this.getHeaders() }
    );
  }

  getPostSalvati(): Observable<PostSalvato[]> {
    return this.http.get<PostSalvato[]>(
      `${this.apiUrl}/posts-salvati`,
      { headers: this.getHeaders() }
    );
  }

  getPostSalvatiByTipo(tipo: string): Observable<PostSalvato[]> {
    return this.http.get<PostSalvato[]>(
      `${this.apiUrl}/posts-salvati/tipo/${tipo}`,
      { headers: this.getHeaders() }
    );
  }

  getPostSalvatiByPiattaforma(piattaforma: string): Observable<PostSalvato[]> {
    return this.http.get<PostSalvato[]>(
      `${this.apiUrl}/posts-salvati/piattaforma/${piattaforma}`,
      { headers: this.getHeaders() }
    );
  }

  eliminaPostSalvato(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/posts-salvati/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getTipiDisponibili(): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.apiUrl}/posts-salvati/tipi`,
      { headers: this.getHeaders() }
    );
  }

  getPiattaformeDisponibili(): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.apiUrl}/posts-salvati/piattaforme`,
      { headers: this.getHeaders() }
    );
  }

  // Altri metodi esistenti del servizio...
  generateContent(prompt: string, platform: string, brandId?: number): Observable<any> {
    const requestBody = {
      prompt: prompt,
      platform: platform,
      brandId: brandId
    };
    
    return this.http.post(
      `${this.apiUrl}/generate`,
      requestBody,
      { headers: this.getHeaders() }
    );
  }

  // Metodi per i brand (se già esistenti)
  getBrands(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/brands`,
      { headers: this.getHeaders() }
    );
  }

  createBrand(brandData: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/brands`,
      brandData,
      { headers: this.getHeaders() }
    );
  }
}