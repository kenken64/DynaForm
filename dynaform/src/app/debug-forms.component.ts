import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { FormsService } from './services/forms.service';

@Component({
    selector: 'app-debug-forms',
    template: `
    <div style="padding: 20px; background: #f5f5f5; margin: 20px; border-radius: 8px;">
      <h2>Forms Loading Debug</h2>
      
      <div style="margin-bottom: 20px;">
        <h3>Authentication Status</h3>
        <p><strong>Is Authenticated:</strong> {{ isAuthenticated }}</p>
        <p><strong>Current User:</strong> {{ currentUser ? currentUser.username : 'None' }}</p>
        <p><strong>Access Token:</strong> {{ hasAccessToken ? 'Present' : 'Missing' }}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3>Forms Service Status</h3>
        <p><strong>Loading:</strong> {{ formsLoading }}</p>
        <p><strong>Error:</strong> {{ formsError || 'None' }}</p>
        <p><strong>Forms Count:</strong> {{ formsCount }}</p>
        <p><strong>Side Menu Forms Count:</strong> {{ sideMenuFormsCount }}</p>
      </div>

      <div>
        <h3>Actions</h3>
        <button (click)="testAuthHeaders()" style="margin-right: 10px; padding: 8px 16px;">Test Auth Headers</button>
        <button (click)="testFormsAPI()" style="margin-right: 10px; padding: 8px 16px;">Test Forms API</button>
        <button (click)="refreshForms()" style="padding: 8px 16px;">Refresh Forms</button>
      </div>

      <div style="margin-top: 20px;">
        <h3>Debug Output</h3>
        <pre style="background: white; padding: 10px; border-radius: 4px; white-space: pre-wrap;">{{ debugOutput }}</pre>
      </div>
    </div>
  `,
    standalone: false
})
export class DebugFormsComponent implements OnInit {
  isAuthenticated = false;
  currentUser: any = null;
  hasAccessToken = false;
  formsLoading = false;
  formsError = '';
  formsCount = 0;
  sideMenuFormsCount = 0;
  debugOutput = '';

  constructor(
    private authService: AuthService,
    private formsService: FormsService
  ) {}

  ngOnInit() {
    this.updateStatus();
    
    // Subscribe to authentication changes
    this.authService.isAuthenticated$.subscribe(() => {
      this.updateStatus();
    });

    // Subscribe to forms refresh events
    this.formsService.formsRefresh$.subscribe(() => {
      this.updateStatus();
    });
  }

  updateStatus() {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.currentUser = this.authService.getCurrentUser();
    this.hasAccessToken = !!localStorage.getItem('access_token');
    this.formsLoading = this.formsService.loading();
    this.formsError = this.formsService.error();
    this.formsCount = this.formsService.forms().length;
    this.sideMenuFormsCount = this.formsService.sideMenuFormsComputed().length;
  }

  testAuthHeaders() {
    try {
      const headers = this.authService.getAuthHeaders();
      const authHeader = headers.get('Authorization');
      this.debugOutput = `Auth Headers:\n${JSON.stringify({
        'Authorization': authHeader,
        'Content-Type': headers.get('Content-Type')
      }, null, 2)}`;
    } catch (error) {
      this.debugOutput = `Error getting auth headers: ${error}`;
    }
  }

  testFormsAPI() {
    this.debugOutput = 'Testing Forms API...\n';
    
    this.formsService.getForms(1, 5).subscribe({
      next: (response) => {
        this.debugOutput += `✅ Forms API Success:\n${JSON.stringify(response, null, 2)}`;
      },
      error: (error) => {
        this.debugOutput += `❌ Forms API Error:\n${JSON.stringify({
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        }, null, 2)}`;
      }
    });
  }

  refreshForms() {
    this.debugOutput = 'Refreshing forms...\n';
    this.formsService.refreshForms();
    setTimeout(() => {
      this.updateStatus();
      this.debugOutput += `✅ Forms refreshed. Count: ${this.formsCount}`;
    }, 1000);
  }
}
