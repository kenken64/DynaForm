import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<string>('light');
  currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    // Initialize theme from localStorage or default to light
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || 'light';
    this.currentThemeSubject.next(initialTheme);
    this.applyTheme(initialTheme);
  }

  setTheme(theme: string): void {
    this.currentThemeSubject.next(theme);
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }

  getCurrentTheme(): string {
    return this.currentThemeSubject.value;
  }

  private applyTheme(theme: string): void {
    // Apply theme using data attribute (primary method)
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    
    // Also apply body classes for backward compatibility with existing styles
    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(`${theme}-theme`);
  }
}
