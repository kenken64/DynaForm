import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { NdiService } from '../../services/ndi.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  isLoading = false;
  errorMessage = '';
  returnUrl = '';
  
  // NDI-related properties
  isNDILoading = false;
  ndiError = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private ndiService: NdiService
  ) {}

  ngOnInit(): void {
    // Get return url from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // If already authenticated, redirect to dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  // Passkey authentication
  async signInWithPasskey(): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const success = await this.authService.authenticateWithPasskey();
      this.isLoading = false;
      
      if (success) {
        this.router.navigate([this.returnUrl]);
      } else {
        // IMPORTANT: Only show error message, never trigger registration automatically
        this.errorMessage = 'Passkey authentication failed. Please try again or register if you don\'t have an account.';
      }
    } catch (error: any) {
      this.isLoading = false;
      // IMPORTANT: Even on unexpected errors, only show message - never auto-register
      this.errorMessage = 'Authentication failed. Please try again or register if you don\'t have an account.';
      console.error('Passkey authentication error:', error);
    }
  }

  // Navigate to register page
  goToRegister(): void {
    this.router.navigate(['/register'], { 
      queryParams: { returnUrl: this.returnUrl } 
    });
  }

  // Navigate to home page
  goToHome(): void {
    this.router.navigate(['/']);
  }

  // NDI authentication
  async signInWithNDI(): Promise<void> {
    if (this.isNDILoading) return;

    this.isNDILoading = true;
    this.ndiError = '';

    try {
      // Navigate to the Bhutan NDI component with return URL
      this.router.navigate(['/bhutan-ndi'], { 
        queryParams: { returnUrl: this.returnUrl } 
      });
    } catch (error: any) {
      console.error('NDI navigation error:', error);
      this.ndiError = 'Failed to navigate to NDI verification. Please try again.';
    } finally {
      this.isNDILoading = false;
    }
  }
}
