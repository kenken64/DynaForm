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
      this.errorMessage = error.message || 'Passkey registration failed. Please try again.';
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
}
