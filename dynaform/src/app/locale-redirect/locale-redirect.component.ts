import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-locale-redirect',
  template: `
    <div class="locale-loading">
      <mat-spinner diameter="40"></mat-spinner>
      <p i18n="@@locale.redirect.loading">Setting up your language preferences...</p>
    </div>
  `,
  styles: [`
    .locale-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 20px;
    }
    .locale-loading p {
      color: #666;
      font-size: 14px;
    }
  `]
})
export class LocaleRedirectComponent implements OnInit {
  
  constructor(
    private router: Router,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    // Get the user's preferred language and redirect to main app
    const preferredLanguage = this.languageService.getCurrentLanguage();
    
    // For now, just navigate to the main dashboard
    // In a full i18n implementation, this would handle locale-based routing
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 1000);
  }
}
