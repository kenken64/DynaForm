import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  isLoading = false;
  errorMessage = '';
  returnUrl = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
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
        this.errorMessage = 'Passkey authentication failed';
      }
    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage = error.message || 'Passkey authentication failed';
      console.error('Passkey authentication error:', error);
    }
  }

  // Navigate to register page
  goToRegister(): void {
    this.router.navigate(['/register'], { 
      queryParams: { returnUrl: this.returnUrl } 
    });
  }
}
