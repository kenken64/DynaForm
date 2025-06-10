import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslationService } from './translation.service';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<string>('en');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  private availableLanguages: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' }
  ];

  constructor(private translationService: TranslationService) {
    // Get saved language from localStorage or use browser language
    const savedLanguage = localStorage.getItem('dynaform-language');
    const browserLanguage = navigator.language.split('-')[0];
    
    const initialLanguage = savedLanguage || 
      (this.isLanguageSupported(browserLanguage) ? browserLanguage : 'en');
    
    this.currentLanguageSubject.next(initialLanguage);
    
    // Set initial translations
    this.translationService.setLanguage(initialLanguage);
  }

  getAvailableLanguages(): Language[] {
    return this.availableLanguages;
  }

  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  setLanguage(languageCode: string): void {
    if (this.isLanguageSupported(languageCode)) {
      this.currentLanguageSubject.next(languageCode);
      localStorage.setItem('dynaform-language', languageCode);
      
      // Update translations immediately
      this.translationService.setLanguage(languageCode);
      
      console.log(`Language changed to: ${languageCode}`);
    }
  }

  private isLanguageSupported(languageCode: string): boolean {
    return this.availableLanguages.some(lang => lang.code === languageCode);
  }

  getLanguageByCode(code: string): Language | undefined {
    return this.availableLanguages.find(lang => lang.code === code);
  }
}
