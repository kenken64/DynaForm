import { Component, Input, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Input() subtitle: string = 'Form Viewer';
  
  authService = inject(AuthService);
  private router = inject(Router);
  
  isDarkMode = true;

  ngOnInit() {
    // Check for saved theme preference or default to dark mode
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme !== null ? savedTheme === 'dark' : true;
    this.updateTheme();
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    this.updateTheme();
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  private updateTheme() {
    if (this.isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateToDebugForms() {
    this.router.navigate(['/debug-forms']);
  }
}
