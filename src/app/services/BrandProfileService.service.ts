import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { BrandProfile } from "../model/BrandProfile.model";
import { AuthService } from "./AuthService.service";

// brand-profile.service.ts
@Injectable({
  providedIn: 'root'
})
export class BrandProfileService {
  private apiUrl = 'http://localhost:8080/api/brand-profiles';

  constructor(private http: HttpClient,
    private authService: AuthService
  ) {}

  getUserBrandProfiles(): Observable<BrandProfile[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get<BrandProfile[]>(this.apiUrl, { headers });
  }

  createBrandProfile(profile: Partial<BrandProfile>): Observable<BrandProfile> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post<BrandProfile>(this.apiUrl, profile, { headers });
  }

  updateBrandProfile(id: string, profile: BrandProfile): Observable<BrandProfile> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.put<BrandProfile>(`${this.apiUrl}/${id}`, profile, { headers });
  }

  deleteBrandProfile(id: string): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}

export enum ToneType {
  FORMALE_PROFESSIONALE = 'FORMALE_PROFESSIONALE',
  CASUALE_FRIENDLY = 'CASUALE_FRIENDLY',
  ENTUSIASTA_ENERGETICO = 'ENTUSIASTA_ENERGETICO',
  TECNICO_DETTAGLIATO = 'TECNICO_DETTAGLIATO',
  MOTIVAZIONALE_ISPIRAZIONE = 'MOTIVAZIONALE_ISPIRAZIONE',
  UMORISMO_SCHERZO = 'UMORISMO_SCHERZO',
  LUSSUOSO_SOFISTICATO = 'LUSSUOSO_SOFISTICATO',
  EDUCATIVO_INFORMATIVO = 'EDUCATIVO_INFORMATIVO'
}


