import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  returnUrl = '';
  registrationStep = 1; // 1: form, 2: passkey setup
  showCompatibilityWarning = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9_]+$/)]]
    });
  }

  ngOnInit(): void {
    // Get return url from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }

    // Check browser compatibility on init
    const userAgent = navigator.userAgent.toLowerCase();
    const browserInfo = this.getBrowserInfo(userAgent);
    this.showCompatibilityWarning = !browserInfo.compatible;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { fullName, email, username } = this.registerForm.value;

      this.authService.register(fullName, email, username).subscribe({
        next: (success) => {
          this.loading = false;
          if (success) {
            this.registrationStep = 2;
            this.successMessage = 'Account information saved! Now set up your passkey for secure authentication.';
          } else {
            this.errorMessage = 'Registration failed. Please try again.';
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Registration failed. Please try again.';
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  async setupPasskey(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const success = await this.authService.registerPasskey();
      this.loading = false;

      if (success) {
        this.successMessage = 'Passkey registration successful! You can now sign in securely.';
        // Redirect to login after showing success message
        setTimeout(() => {
          this.router.navigate(['/login'], { 
            queryParams: { message: 'Registration successful. Please sign in with your passkey.' }
          });
        }, 2000);
      } else {
        this.errorMessage = 'Passkey registration failed. You can try again or contact support.';
      }
    } catch (error: any) {
      this.loading = false;
      console.error('Passkey setup error:', error);
      
      // Enhanced error handling for WebAuthn issues
      if (error.message?.includes('secure context')) {
        this.errorMessage = `
          ⚠️ Secure Connection Required: Passkeys require HTTPS.
          
          • If you're testing locally, try accessing via: https://localhost:4200
          • Make sure your browser supports secure contexts
          • Contact support if this continues
        `;
      } else if (error.message?.includes('not supported')) {
        this.errorMessage = `
          🌐 Browser Compatibility Issue: Your browser doesn't support passkeys.
          
          ✅ Recommended browsers:
          • Chrome 67+ • Firefox 60+ • Safari 14+ • Edge 18+
          
          🔄 Try refreshing the page or use a different browser
        `;
      } else if (error.message?.includes('User cancelled') || error.message?.includes('AbortError')) {
        this.errorMessage = 'Passkey setup was cancelled. You can try again when ready.';
      } else {
        this.errorMessage = error.message || 'Passkey registration failed. Please try again.';
      }
    }
  }

  skipPasskey(): void {
    this.router.navigate(['/login'], {
      queryParams: { 
        message: 'Registration successful. You can set up a passkey later in your profile.',
        returnUrl: this.returnUrl 
      }
    });
  }

  goBack(): void {
    if (this.registrationStep === 2) {
      this.registrationStep = 1;
      this.successMessage = '';
      this.errorMessage = '';
    } else {
      this.router.navigate(['/login']);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} must be at least ${requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        const requiredLength = field.errors['maxlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} must not exceed ${requiredLength} characters`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Passwords do not match';
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Name',
      email: 'Email',
      username: 'Username',
      password: 'Password',
      confirmPassword: 'Confirm Password'
    };
    return labels[fieldName] || fieldName;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Browser compatibility and error handling methods
  checkBrowserCompatibility(): void {
    const userAgent = navigator.userAgent.toLowerCase();
    const browserInfo = this.getBrowserInfo(userAgent);
    
    let compatibilityMessage = `🌐 Browser Detected: ${browserInfo.name} ${browserInfo.version}\n\n`;
    
    if (browserInfo.compatible) {
      compatibilityMessage += '✅ Your browser supports passkeys!\n\n';
      compatibilityMessage += 'Troubleshooting tips:\n';
      compatibilityMessage += '• Make sure you\'re using HTTPS or localhost\n';
      compatibilityMessage += '• Check if your device has biometric authentication\n';
      compatibilityMessage += '• Try refreshing the page\n';
      compatibilityMessage += '• Ensure pop-ups are not blocked';
    } else {
      compatibilityMessage += '❌ Your browser may not fully support passkeys.\n\n';
      compatibilityMessage += '✅ Recommended browsers:\n';
      compatibilityMessage += '• Chrome 67+ or Edge 18+\n';
      compatibilityMessage += '• Firefox 60+\n';
      compatibilityMessage += '• Safari 14+';
    }
    
    alert(compatibilityMessage);
  }

  private getBrowserInfo(userAgent: string): {name: string, version: string, compatible: boolean} {
    let name = 'Unknown';
    let version = 'Unknown';
    let compatible = false;

    if (userAgent.includes('chrome')) {
      name = 'Chrome';
      const match = userAgent.match(/chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      compatible = parseInt(version) >= 67;
    } else if (userAgent.includes('firefox')) {
      name = 'Firefox';
      const match = userAgent.match(/firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      compatible = parseInt(version) >= 60;
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      name = 'Safari';
      const match = userAgent.match(/version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      compatible = parseInt(version) >= 14;
    } else if (userAgent.includes('edge')) {
      name = 'Edge';
      const match = userAgent.match(/edge\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      compatible = parseInt(version) >= 18;
    }

    return { name, version, compatible };
  }

  clearError(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.showCompatibilityWarning = false;
  }
}
