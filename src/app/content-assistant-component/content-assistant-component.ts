import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { BrandProfile } from '../model/BrandProfile.model';
import { AnalysisType, AssistantResponse, ContentAnalysisRequest, ContentAssistantService, ContentSuggestion } from '../services/ContentAssistantService.service';

@Component({
  selector: 'app-content-assistant-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './content-assistant-component.html',
  styleUrl: './content-assistant-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentAssistantComponent implements OnDestroy {
  @Input() selectedBrand: BrandProfile | null = null;
  @Input() selectedPlatform: string = 'linkedin';
  @Output() suggestionApplied = new EventEmitter<string>();
  
  // Stato componente
  content: string = '';
  selectedAnalysisType: AnalysisType = AnalysisType.BRAND_ALIGNMENT;
  isAnalyzing: boolean = false;
  analysisResult: AssistantResponse | null = null;
  error: string = '';
  
  // 🔥 NUOVE PROPRIETÀ PER ANTEPRIMA FINALE
  showFinalPreview: boolean = false;
  optimizedContent: string = '';
  appliedSuggestions: ContentSuggestion[] = [];
  estimatedOptimizedScore: number = 0;
  
  // Opzioni disponibili
  analysisTypes = Object.values(AnalysisType);
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private assistantService: ContentAssistantService,
    private cdr: ChangeDetectorRef
  ) {}
  
  @Input() set prefillContent(content: string) {
    if (content && content !== this.content && !this.isAnalyzing) {
      this.content = content;
      this.resetAnalysis();
    }
  }
  
  analyzeContent(): void {
    if (!this.content.trim()) {
      this.error = 'Inserisci un contenuto da analizzare';
      this.cdr.markForCheck();
      return;
    }
    
    if (!this.selectedBrand) {
      this.error = 'Seleziona un brand prima di analizzare';
      this.cdr.markForCheck();
      return;
    }
    
    this.isAnalyzing = true;
    this.error = '';
    this.analysisResult = null;
    this.showFinalPreview = false;
    this.optimizedContent = '';
    this.appliedSuggestions = [];
    
    const request: ContentAnalysisRequest = {
      content: this.content,
      brandId: this.selectedBrand.id!,
      platform: this.selectedPlatform,
      analysisType: this.selectedAnalysisType,
      includeSuggestions: true
    };
    
    this.assistantService.analyzeContent(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.analysisResult = result;
          this.isAnalyzing = false;
          // Genera automaticamente la versione ottimizzata
          this.generateOptimizedContent();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('❌ Errore analisi:', error);
          this.error = 'Errore durante l\'analisi. Riprova.';
          this.isAnalyzing = false;
          this.cdr.markForCheck();
        }
      });
  }
  
  // 🔥 NUOVI METODI PER ANTEPRIMA FINALE
  
  toggleFinalPreview(): void {
    this.showFinalPreview = !this.showFinalPreview;
    if (this.showFinalPreview && !this.optimizedContent) {
      this.generateOptimizedContent();
    }
    this.cdr.markForCheck();
  }
  
  generateOptimizedContent(): void {
    if (!this.content || !this.analysisResult) return;
    
    // Inizia con il contenuto originale
    this.optimizedContent = this.content;
    this.appliedSuggestions = [];
    
    // Applica automaticamente i suggerimenti più importanti
    this.analysisResult.suggestions.forEach(suggestion => {
      if (this.shouldAutoApply(suggestion)) {
        this.applySuggestionToOptimized(suggestion);
      }
    });
    
    // Calcola punteggio stimato
    this.calculateEstimatedScore();
  }
  
  applySuggestionToOptimized(suggestion: ContentSuggestion): void {
    const originalContent = this.optimizedContent;
    
    if (suggestion.current && this.optimizedContent.includes(suggestion.current)) {
      this.optimizedContent = this.optimizedContent.replace(
        suggestion.current, 
        suggestion.suggested
      );
      
      // Registra la modifica solo se effettivamente cambiata
      if (this.optimizedContent !== originalContent) {
        this.appliedSuggestions.push(suggestion);
      }
    } else if (!suggestion.current || suggestion.current.trim() === '') {
      // Aggiungi nuovo contenuto
      this.optimizedContent += '\n\n' + suggestion.suggested;
      this.appliedSuggestions.push(suggestion);
    }
  }
  
  shouldAutoApply(suggestion: ContentSuggestion): boolean {
    // Applica automaticamente suggerimenti ad alto impatto
    const highImpactTypes = ['BRAND', 'TONO'];
    return highImpactTypes.includes(suggestion.type) || 
           suggestion.type === 'ENGAGEMENT';
  }
  
  calculateEstimatedScore(): void {
    if (!this.analysisResult) return;
    
    const baseScore = this.analysisResult.qualityScore;
    const improvementFactor = this.appliedSuggestions.length * 0.5; // 0.5 punti per ogni miglioramento
    
    this.estimatedOptimizedScore = Math.min(10, Math.round((baseScore + improvementFactor) * 10) / 10);
  }
  
  applySuggestion(suggestion: ContentSuggestion): void {
    if (suggestion.current && this.content.includes(suggestion.current)) {
      this.content = this.content.replace(suggestion.current, suggestion.suggested);
    } else {
      this.content += '\n\n' + suggestion.suggested;
    }
    this.suggestionApplied.emit(this.content);
    
    // Aggiorna anche la versione ottimizzata se esiste
    if (this.optimizedContent) {
      this.generateOptimizedContent();
    }
    
    this.cdr.markForCheck();
  }
  
  applyAllOptimizations(): void {
    this.content = this.optimizedContent;
    this.suggestionApplied.emit(this.content);
    this.showFinalPreview = false;
    this.cdr.markForCheck();
  }
  
  revertAllChanges(): void {
    this.optimizedContent = this.content;
    this.appliedSuggestions = [];
    this.calculateEstimatedScore();
    this.cdr.markForCheck();
  }
  
  // copyToClipboard(): void {
  //   if (!this.optimizedContent) return;
    
  //   navigator.clipboard.writeText(this.optimizedContent)
  //     .then(() => {
  //       console.log('Testo copiato negli appunti!');
  //       // Potresti aggiungere un toast notification qui
  //     })
  //     .catch(err => {
  //       console.error('Errore nella copia:', err);
  //       // Fallback per browser più vecchi
  //       const textArea = document.createElement('textarea');
  //       textArea.value = this.optimizedContent;
  //       document.body.appendChild(textArea);
  //       textArea.select();
  //       document.execCommand('copy');
  //       document.body.removeChild(textArea);
  //     });
  // }
  
  exportToPlatform(): void {
    // Implementa l'integrazione con le piattaforme social
    console.log(`Esporta su ${this.selectedPlatform}:`, this.optimizedContent);
    // Qui puoi implementare API per postare direttamente
    alert(`Pronto per esportare su ${this.selectedPlatform}!\n\n${this.optimizedContent}`);
  }
  
  extractHashtags(content: string): string[] {
    const matches = content.match(/#(\w+)/g);
    return matches ? matches.slice(0, 5) : []; // Massimo 5 hashtag
  }
  
  getPlatformDisplayInfo(): string {
    const platforms: { [key: string]: string } = {
      'linkedin': 'LinkedIn • Post aziendale',
      'instagram': 'Instagram • Post feed',
      'facebook': 'Facebook • Post pagina',
      'twitter': 'X (Twitter) • Tweet',
      'tiktok': 'TikTok • Descrizione video'
    };
    return platforms[this.selectedPlatform] || 'Post social';
  }
  

  
  getChangeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'TONO': '🎭',
      'ENGAGEMENT': '💬',
      'BRAND': '🏢',
      'STRUCTURE': '📐',
      'TECHNICAL': '⚙️'
    };
    return icons[type] || '📝';
  }
  
  getChangeDescription(suggestion: ContentSuggestion): string {
    if (suggestion.current && suggestion.current.trim()) {
      const shortCurrent = suggestion.current.length > 50 
        ? suggestion.current.substring(0, 47) + '...' 
        : suggestion.current;
      return `Modificato: "${shortCurrent}"`;
    }
    const shortSuggested = suggestion.suggested.length > 50 
      ? suggestion.suggested.substring(0, 47) + '...' 
      : suggestion.suggested;
    return `Aggiunto: ${shortSuggested}`;
  }
  
  // 🔥 FINE NUOVI METODI
  
  resetAnalysis(): void {
    this.analysisResult = null;
    this.error = '';
    this.showFinalPreview = false;
    this.optimizedContent = '';
    this.appliedSuggestions = [];
    this.cdr.markForCheck();
  }
  
  newAnalysis(): void {
    this.content = '';
    this.resetAnalysis();
    this.cdr.markForCheck();
  }
  
  // ✅ METODI HELPER
  getAnalysisTypeLabel(type: AnalysisType): string {
    const labels: { [key in AnalysisType]: string } = {
      [AnalysisType.TONE_CONSISTENCY]: 'Coerenza Tono',
      [AnalysisType.ENGAGEMENT_OPTIMIZATION]: 'Ottimizzazione Engagement', 
      [AnalysisType.BRAND_ALIGNMENT]: 'Allineamento Brand',
      [AnalysisType.PLATFORM_OPTIMIZATION]: 'Ottimizzazione Piattaforma'
    };
    return labels[type];
  }
  
  getScoreColor(score: number): string {
    if (score >= 8) return '#4CAF50'; // Verde
    if (score >= 6) return '#FFC107'; // Giallo
    if (score >= 4) return '#FF9800'; // Arancione
    return '#F44336'; // Rosso
  }
  
  getScoreText(score: number): string {
    if (score >= 8) return 'Eccellente';
    if (score >= 6) return 'Buono';
    if (score >= 4) return 'Sufficiente';
    return 'Da migliorare';
  }

  // ✅ METODI TRACKBY
  trackByIndex(index: number, item: any): number {
    return index;
  }

  trackBySuggestion(index: number, suggestion: ContentSuggestion): string {
    return suggestion.type + index + suggestion.current?.substring(0, 20) || '';
  }

  trackByAnalysisType(index: number, type: AnalysisType): string {
    return type;
  }
  
  getSuggestionTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      'TONO': '🎭 Tono di Voce',
      'ENGAGEMENT': '💬 Coinvolgimento',
      'BRAND': '🏢 Allineamento Brand',
      'TECHNICAL': '⚙️ Tecnico',
      'STRUCTURE': '📐 Struttura'
    };
    return typeLabels[type] || type;
  }

  getImpactClass(type: string): string {
    const impactMap: { [key: string]: string } = {
      'TONO': 'impact-high',
      'ENGAGEMENT': 'impact-medium',
      'BRAND': 'impact-high',
      'TECHNICAL': 'impact-low',
      'STRUCTURE': 'impact-medium'
    };
    return impactMap[type] || 'impact-medium';
  }

  getImpactText(type: string): string {
    const impactTexts: { [key: string]: string } = {
      'TONO': 'Alto impatto',
      'ENGAGEMENT': 'Medio impatto',
      'BRAND': 'Alto impatto',
      'TECHNICAL': 'Basso impatto',
      'STRUCTURE': 'Medio impatto'
    };
    return impactTexts[type] || 'Medio impatto';
  }

  getReasonCategory(reason: string): string {
    if (reason.toLowerCase().includes('tono') || reason.toLowerCase().includes('voce')) {
      return 'Tono';
    }
    if (reason.toLowerCase().includes('engagement') || reason.toLowerCase().includes('coinvolgimento')) {
      return 'Coinvolgimento';
    }
    if (reason.toLowerCase().includes('brand') || reason.toLowerCase().includes('valori')) {
      return 'Brand';
    }
    if (reason.toLowerCase().includes('struttura') || reason.toLowerCase().includes('organizzazione')) {
      return 'Struttura';
    }
    return 'Generale';
  }

  getSuggestionBenefits(type: string): string[] {
    const benefits: { [key: string]: string[] } = {
      'TONO': ['Coerenza brand', 'Percezione migliore'],
      'ENGAGEMENT': ['Più interazioni', 'Maggior coinvolgimento'],
      'BRAND': ['Allineamento valori', 'Identità forte'],
      'STRUCTURE': ['Chiarezza', 'Leggibilità']
    };
    return benefits[type] || ['Miglioramento generale'];
  }

  highlightDifferences(current: string, suggested: string): { 
    removedText: string, 
    addedText: string 
  } {
    // Implementazione base - mostra il testo completo
    return {
      removedText: current,
      addedText: suggested
    };
  }

  countWordChanges(current: string, suggested: string): number {
    const currentWords = current.split(/\s+/).filter(w => w.trim().length > 0);
    const suggestedWords = suggested.split(/\s+/).filter(w => w.trim().length > 0);
    
    // Calcola parole diverse usando un approccio più accurato
    const maxLength = Math.max(currentWords.length, suggestedWords.length);
    let changes = 0;
    
    for (let i = 0; i < maxLength; i++) {
      const currentWord = currentWords[i] || '';
      const suggestedWord = suggestedWords[i] || '';
      
      if (currentWord.toLowerCase() !== suggestedWord.toLowerCase()) {
        changes++;
      }
    }
    
    return changes;
  }

  detectToneChange(suggestion: ContentSuggestion): string {
    const reason = suggestion.reason.toLowerCase();
    
    if (reason.includes('più formale') || reason.includes('meno informale')) {
      return 'Più formale';
    }
    if (reason.includes('più informale') || reason.includes('meno formale')) {
      return 'Più amichevole';
    }
    if (reason.includes('più conciso') || reason.includes('meno verboso')) {
      return 'Più conciso';
    }
    if (reason.includes('più dettagliato')) {
      return 'Più dettagliato';
    }
    if (reason.includes('positivo') || reason.includes('ottimista')) {
      return 'Più positivo';
    }
    if (reason.includes('professionale')) {
      return 'Più professionale';
    }
    
    return 'Migliorato';
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  copyToClipboard(text: string) {
 
  navigator.clipboard.writeText(text).then(() => {
  
  }).catch(err => {
    console.error('Errore nella copia: ', err);
  });
}
}