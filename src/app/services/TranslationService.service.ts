// translation.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
   private currentLangSubject = new BehaviorSubject<'it' | 'en'>('en');
  public currentLang$ = this.currentLangSubject.asObservable();

  constructor() {
    // Inizializza con la lingua salvata o inglese di default
    const savedLang = localStorage.getItem('preferredLanguage') as 'it' | 'en';
    const initialLang = savedLang || 'en';
    this.currentLangSubject = new BehaviorSubject(initialLang);
  }

  private translations: any = {
    it: {
      // Header
      'title': '🎨 SocialCraft Generator',
      'subtitle': 'Trasforma le tue idee in contenuti virali',
      'archive': 'Archivio',
      'credits': 'crediti',
      'logout': 'Logout',
      
      // Generator
      'generateContent': 'Genera contenuto',
      'manual': '✍️ Manuale',
      'guided': '🚀 Guidato',
      'manualPlaceholder': 'Descrivi cosa vuoi comunicare (minimo 10 caratteri)... Es: \'Voglio promuovere il mio nuovo corso di yoga online per principianti, focalizzato sul rilassamento e flessibilità\'',
      'selectBrand': '🎨 Seleziona o crea Brand Memory',
      'brandSelected': 'Brand selezionato:',
      'platform': 'Piattaforma:',
      'postType': 'Tipo di post:',
      'controlBars': '🎚️ Control Bars',
      'generateButton': 'Genera Contenuto',
      'generating': 'Generando...',
      
      // Guided Mode Labels
      'topic': '🏷️ Argomento Principale *',
      'goal': '🎯 Obiettivo del Post *', 
      'details': '💡 Dettagli specifici (opzionale)',
      'preview': '📋 Questo è ciò che verrà generato:',
      
      // Topics
      'topic.food': '🍕 Cibo & Ricette',
      'topic.fitness': '💪 Fitness & Salute',
      'topic.tech': '💻 Tecnologia',
      'topic.fashion': '👗 Moda & Beauty',
      'topic.business': '💼 Business & Startup',
      'topic.travel': '✈️ Viaggi & Avventura',
      'topic.lifestyle': '🏡 Lifestyle',
      'topic.education': '🎓 Educazione',
      'topic.entertainment': '🎬 Intrattenimento',
      'topic.sports': '⚽ Sport',
      'topic.finance': '💰 Finanza Personale',
      
      // Goals
      'goal.awareness': '👀 Aumentare visibilità',
      'goal.engagement': '💬 Generare like/commenti',
      'goal.conversion': '🛒 Vendere prodotti/servizi',
      'goal.leads': '📩 Raccolta contatti',
      'goal.community': '👥 Costruire community',
      'goal.traffic': '🌐 Portare traffico al sito',
      
      // Post Types
      'postType.promotional': 'promozionale',
      'postType.testimonial': 'testimonial',
      'postType.educational': 'educativo',
      'postType.customerStory': 'storia cliente',
      
      // Control Bars Names
      'emotion': 'Tono Emotivo',
      'creativity': 'Creatività',
      'formality': 'Formalità',
      'urgency': 'Urgenza',
      'length': 'Lunghezza',
      
      // Output
      'viewResults': 'Visualizza risultati →',
      'socialPosts': 'Post Social',
      'headlines': 'Titoli',
      'quotes': 'Citazioni',
      'ctas': 'Call-to-Action',
      
      // Modal
      'copy': '📋 Copia',
      'copied': '✅ Copiato!',
      'save': '💾 Salva'
    },
    en: {
      // Header
      'title': '🎨 SocialCraft Generator',
      'subtitle': 'Transform your ideas into viral content',
      'archive': 'Archive',
      'credits': 'credits',
      'logout': 'Logout',
      
      // Generator
      'generateContent': 'Generate Content',
      'manual': '✍️ Manual',
      'guided': '🚀 Guided',
      'manualPlaceholder': 'Describe what you want to communicate (minimum 10 characters)... Ex: \'I want to promote my new online yoga course for beginners, focused on relaxation and flexibility\'',
      'selectBrand': '🎨 Select or create Brand Memory',
      'brandSelected': 'Brand selected:',
      'platform': 'Platform:',
      'postType': 'Post type:',
      'controlBars': '🎚️ Control Bars',
      'generateButton': 'Generate Content',
      'generating': 'Generating...',
      
      // Guided Mode Labels
      'topic': '🏷️ Main Topic *',
      'goal': '🎯 Post Goal *',
      'details': '💡 Specific details (optional)',
      'preview': '📋 This is what will be generated:',
      
      // Topics
      'topic.food': '🍕 Food & Recipes',
      'topic.fitness': '💪 Fitness & Health',
      'topic.tech': '💻 Technology',
      'topic.fashion': '👗 Fashion & Beauty',
      'topic.business': '💼 Business & Startup',
      'topic.travel': '✈️ Travel & Adventure',
      'topic.lifestyle': '🏡 Lifestyle',
      'topic.education': '🎓 Education',
      'topic.entertainment': '🎬 Entertainment',
      'topic.sports': '⚽ Sports',
      'topic.finance': '💰 Personal Finance',
      
      // Goals
      'goal.awareness': '👀 Increase visibility',
      'goal.engagement': '💬 Generate likes/comments',
      'goal.conversion': '🛒 Sell products/services',
      'goal.leads': '📩 Collect contacts',
      'goal.community': '👥 Build community',
      'goal.traffic': '🌐 Drive website traffic',
      
      // Post Types
      'postType.promotional': 'promotional',
      'postType.testimonial': 'testimonial',
      'postType.educational': 'educational',
      'postType.customerStory': 'customer story',
      
      // Control Bars Names
      'emotion': 'Emotional Tone',
      'creativity': 'Creativity',
      'formality': 'Formality',
      'urgency': 'Urgency',
      'length': 'Length',
      
      // Output
      'viewResults': 'View results →',
      'socialPosts': 'Social Posts',
      'headlines': 'Headlines',
      'quotes': 'Quotes',
      'ctas': 'Call-to-Action',
      
      // Modal
      'copy': '📋 Copy',
      'copied': '✅ Copied!',
      'save': '💾 Save'
    }
  };

  translate(key: string): string {
    // 👇 CORREGGI: usa this.currentLangSubject.value invece di this.currentLang.next
    const currentLang = this.currentLangSubject.value;
    const langTranslations = this.translations[currentLang];
    
    // 👇 AGGIUNGI UN FALLBACK SICURO
    if (langTranslations && key in langTranslations) {
      return langTranslations[key];
    }
    
    // Fallback: prova l'altra lingua o restituisci la chiave
    const otherLang = currentLang === 'it' ? 'en' : 'it';
    const otherTranslations = this.translations[otherLang];
    
    return otherTranslations?.[key] || key;
  }

  setLanguage(lang: 'it' | 'en') {
     this.currentLangSubject.next(lang);
    localStorage.setItem('preferredLanguage', lang);
  }

  getCurrentLanguage(): 'it' | 'en' {
      return this.currentLangSubject.value;
  }
}