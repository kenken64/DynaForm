import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ThemeService } from '../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, OnDestroy {
  // Theme settings
  currentTheme: string = 'light';
  private themeSubscription?: Subscription;

  // Notification settings
  emailNotifications: boolean = true;
  browserNotifications: boolean = false;

  // Privacy settings
  analyticsEnabled: boolean = true;
  autoSaveEnabled: boolean = true;

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    this.loadSettings();
    
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  private loadSettings() {
    // Theme is now managed by ThemeService, just get current value
    this.currentTheme = this.themeService.getCurrentTheme();
    
    // Load notification preferences
    this.emailNotifications = localStorage.getItem('emailNotifications') !== 'false';
    this.browserNotifications = localStorage.getItem('browserNotifications') === 'true';
    
    // Load privacy preferences
    this.analyticsEnabled = localStorage.getItem('analyticsEnabled') !== 'false';
    this.autoSaveEnabled = localStorage.getItem('autoSaveEnabled') !== 'false';
  }

  onThemeChange(event: MatButtonToggleChange) {
    // Use theme service to manage theme changes
    this.themeService.setTheme(event.value);
    console.log(`Theme changed to: ${event.value}`);
  }

  onEmailNotificationChange(event: MatSlideToggleChange) {
    this.emailNotifications = event.checked;
    localStorage.setItem('emailNotifications', this.emailNotifications.toString());
    console.log(`Email notifications: ${this.emailNotifications}`);
  }

  onBrowserNotificationChange(event: MatSlideToggleChange) {
    this.browserNotifications = event.checked;
    localStorage.setItem('browserNotifications', this.browserNotifications.toString());
    
    // Request permission for browser notifications if enabled
    if (this.browserNotifications && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission !== 'granted') {
          this.browserNotifications = false;
          localStorage.setItem('browserNotifications', 'false');
        }
      });
    }
    
    console.log(`Browser notifications: ${this.browserNotifications}`);
  }

  onAnalyticsChange(event: MatSlideToggleChange) {
    this.analyticsEnabled = event.checked;
    localStorage.setItem('analyticsEnabled', this.analyticsEnabled.toString());
    console.log(`Analytics enabled: ${this.analyticsEnabled}`);
  }

  onAutoSaveChange(event: MatSlideToggleChange) {
    this.autoSaveEnabled = event.checked;
    localStorage.setItem('autoSaveEnabled', this.autoSaveEnabled.toString());
    console.log(`Auto-save enabled: ${this.autoSaveEnabled}`);
  }
}
