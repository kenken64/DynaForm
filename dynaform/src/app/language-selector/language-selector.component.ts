import { Component, OnInit, OnDestroy } from '@angular/core';
import { LanguageService, Language } from '../services/language.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-language-selector',
    templateUrl: './language-selector.component.html',
    styleUrls: ['./language-selector.component.css'],
    standalone: false
})
export class LanguageSelectorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  availableLanguages: Language[] = [];
  currentLanguage: string = 'en';

  constructor(private languageService: LanguageService) {}

  ngOnInit(): void {
    this.availableLanguages = this.languageService.getAvailableLanguages();
    
    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(language => {
        this.currentLanguage = language;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLanguageChange(languageCode: string): void {
    this.languageService.setLanguage(languageCode);
  }

  getCurrentLanguageInfo(): Language | undefined {
    return this.languageService.getLanguageByCode(this.currentLanguage);
  }
}
