// services/content-assistant.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ContentAnalysisRequest {
  content: string;
  brandId: string;
  platform: string;
  analysisType: AnalysisType;
  includeSuggestions?: boolean;
}

export interface AssistantResponse {
  strengths: string[];
  improvements: string[];
  suggestions: ContentSuggestion[];
  platformTips: string[];
  qualityScore: number;
  confidence: number;
}

export interface ContentSuggestion {
  type: string;
  current: string;
  suggested: string;
  reason: string;
}

export enum AnalysisType {
  TONE_CONSISTENCY = 'TONE_CONSISTENCY',
  ENGAGEMENT_OPTIMIZATION = 'ENGAGEMENT_OPTIMIZATION', 
  BRAND_ALIGNMENT = 'BRAND_ALIGNMENT',
  PLATFORM_OPTIMIZATION = 'PLATFORM_OPTIMIZATION'
}

@Injectable({
  providedIn: 'root'
})
export class ContentAssistantService {
  
  private apiUrl = `${environment.apiUrl}/assistant`;

  constructor(private http: HttpClient) { }

  analyzeContent(request: ContentAnalysisRequest): Observable<AssistantResponse> {
    return this.http.post<AssistantResponse>(`${this.apiUrl}/analyze`, request);
  }
}