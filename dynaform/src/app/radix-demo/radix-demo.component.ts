import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Import our Radix components
import { RadixButtonComponent } from '../ui/radix-button/radix-button.component';
import { RadixInputComponent } from '../ui/radix-input/radix-input.component';
import { 
  RadixCardComponent,
  RadixCardHeaderComponent,
  RadixCardTitleComponent,
  RadixCardDescriptionComponent,
  RadixCardContentComponent,
  RadixCardFooterComponent
} from '../ui/radix-card/radix-card.component';

/**
 * Demo component showing Radix-NG migration
 * This replaces Material components with Radix equivalents
 */
@Component({
  selector: 'app-radix-demo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RadixButtonComponent,
    RadixInputComponent,
    RadixCardComponent,
    RadixCardHeaderComponent,
    RadixCardTitleComponent,
    RadixCardDescriptionComponent,
    RadixCardContentComponent,
    RadixCardFooterComponent
  ],
  template: `
    <div class="demo-container">
      <h1>Radix-NG Migration Demo</h1>
      
      <!-- Example: Login Form Card -->
      <rdx-card variant="elevated" class="form-card">
        <rdx-card-header>
          <rdx-card-title>Login Form</rdx-card-title>
          <rdx-card-description>
            This form uses Radix-NG components instead of Angular Material
          </rdx-card-description>
        </rdx-card-header>
        
        <rdx-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="form">
            <rdx-input
              label="Email"
              type="email"
              placeholder="Enter your email"
              formControlName="email"
              [required]="true"
              [errorMessage]="getErrorMessage('email')"
              hint="We'll never share your email">
            </rdx-input>
            
            <rdx-input
              label="Password"
              type="password"
              placeholder="Enter your password"
              formControlName="password"
              [required]="true"
              [errorMessage]="getErrorMessage('password')">
            </rdx-input>
          </form>
        </rdx-card-content>
        
        <rdx-card-footer>
          <rdx-button 
            variant="outline" 
            (onClick)="onCancel()">
            Cancel
          </rdx-button>
          
          <rdx-button 
            variant="primary" 
            type="submit"
            [disabled]="loginForm.invalid"
            (onClick)="onSubmit()">
            Sign In
          </rdx-button>
        </rdx-card-footer>
      </rdx-card>
      
      <!-- Example: Button Variants -->
      <rdx-card class="button-demo">
        <rdx-card-header>
          <rdx-card-title>Button Variants</rdx-card-title>
          <rdx-card-description>
            All button variants available in the Radix system
          </rdx-card-description>
        </rdx-card-header>
        
        <rdx-card-content>
          <div class="button-grid">
            <rdx-button variant="primary" (onClick)="showAlert('Primary')">
              Primary
            </rdx-button>
            
            <rdx-button variant="secondary" (onClick)="showAlert('Secondary')">
              Secondary
            </rdx-button>
            
            <rdx-button variant="outline" (onClick)="showAlert('Outline')">
              Outline
            </rdx-button>
            
            <rdx-button variant="ghost" (onClick)="showAlert('Ghost')">
              Ghost
            </rdx-button>
            
            <rdx-button variant="destructive" (onClick)="showAlert('Destructive')">
              Delete
            </rdx-button>
            
            <rdx-button variant="primary" size="sm" (onClick)="showAlert('Small')">
              Small
            </rdx-button>
            
            <rdx-button variant="primary" size="lg" (onClick)="showAlert('Large')">
              Large Button
            </rdx-button>
            
            <rdx-button variant="primary" [disabled]="true">
              Disabled
            </rdx-button>
          </div>
        </rdx-card-content>
      </rdx-card>
    </div>
  `,
  styles: [`
    .demo-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    h1 {
      text-align: center;
      color: #111827;
      font-size: 32px;
      font-weight: 700;
      margin: 0;
    }

    .form-card {
      max-width: 400px;
      margin: 0 auto;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .button-demo {
      width: 100%;
    }

    .button-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      align-items: center;
    }
  `]
})
export class RadixDemoComponent {
  loginForm: FormGroup;
  
  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
  
  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }
  
  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log('Form submitted:', this.loginForm.value);
      alert('Form submitted successfully!');
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
  
  onCancel(): void {
    this.loginForm.reset();
    alert('Form cancelled');
  }
  
  showAlert(variant: string): void {
    alert(`${variant} button clicked!`);
  }
}
