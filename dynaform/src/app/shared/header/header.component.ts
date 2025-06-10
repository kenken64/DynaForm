import { Component, Input, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { TranslationService } from '../../services/translation.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css'],
    standalone: false
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() subtitle: string = 'Form Viewer';
  
  authService = inject(AuthService);
  private router = inject(Router);
  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  private translationSubscription?: Subscription;

  ngOnInit() {
    // Subscribe to translation changes to trigger re-rendering
    this.translationSubscription = this.translationService.currentTranslations$.subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    if (this.translationSubscription) {
      this.translationSubscription.unsubscribe();
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
