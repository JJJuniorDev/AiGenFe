// translation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLang: 'it' | 'en' = 'it';
  
  // 👇 Dizionario per testi statici (massima qualità)
  private translations: { 
    it: { [key: string]: string };
    en: { [key: string]: string };
  } = {
    it: {
      // Header
      'title': '🎨 SocialCraft Generator',
      'subtitle': 'Trasforma le tue idee in contenuti virali',
      'credits': 'crediti',
      'logout': 'Logout',
      
      // Generator
      'generateContent': 'Genera contenuto',
      'manual': 'Manuale',
      'guided': 'Guidato',
      'selectBrand': 'Seleziona o crea Brand Memory',
      'brandSelected': 'Brand selezionato:',
      'platform': 'Piattaforma:',
      'postType': 'Tipo di post:',
      'controlBars': '🎚️ Control Bars',
      'generate': 'Genera',
      'generating': 'Generando...',
      
      // Guided Mode
      'contentType': '🎯 Tipo di Contenuto',
      'topic': '🏷️ Argomento Principale',
      'goal': '🎯 Obiettivo del Post',
      'details': '💡 Dettagli specifici (opzionale)',
      'preview': '📋 Questo è ciò che verrà generato:',
      
      // Output
      'viewResults': 'Visualizza risultati →',
      'socialPosts': 'Post Social',
      'headlines': 'Titoli',
      'quotes': 'Citazioni',
      'ctas': 'Call-to-Action',
      
      // Modal
      'copy': 'Copia',
      'copied': 'Copiato!'
    },
    en: {
      // Header
      'title': '🎨 SocialCraft Generator',
      'subtitle': 'Transform your ideas into viral content',
      'credits': 'credits',
      'logout': 'Logout',
      
      // Generator
      'generateContent': 'Generate Content',
      'manual': 'Manual',
      'guided': 'Guided',
      'selectBrand': 'Select or create Brand Memory',
      'brandSelected': 'Brand selected:',
      'platform': 'Platform:',
      'postType': 'Post Type:',
      'controlBars': '🎚️ Control Bars',
      'generate': 'Generate',
      'generating': 'Generating...',
      
      // Guided Mode
      'contentType': '🎯 Content Type',
      'topic': '🏷️ Main Topic',
      'goal': '🎯 Post Goal',
      'details': '💡 Specific details (optional)',
      'preview': '📋 This is what will be generated:',
      
      // Output
      'viewResults': 'View results →',
      'socialPosts': 'Social Posts',
      'headlines': 'Headlines',
      'quotes': 'Quotes',
      'ctas': 'Call-to-Action',
      
      // Modal
      'copy': 'Copy',
      'copied': 'Copied!'
    }
  };

  // 👇 Per testi statici (massima qualità)
  translate(key: string): string {
    const langTranslations = this.translations[this.currentLang];
    return langTranslations[key] || key;
  }

  setLanguage(lang: 'it' | 'en') {
    this.currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);
  }

  getCurrentLanguage(): 'it' | 'en' {
    return this.currentLang;
  }
}

 