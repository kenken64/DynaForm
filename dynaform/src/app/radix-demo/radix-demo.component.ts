import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Import our Radix components
import { 
  RadixButtonComponent,
  RadixInputComponent,
  RadixCardComponent,
  RadixCheckboxComponent,
  RadixSelectComponent,
  SelectOption
} from '../ui';

@Component({
  selector: 'app-radix-demo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RadixButtonComponent,
    RadixInputComponent,
    RadixCardComponent,
    RadixCheckboxComponent,
    RadixSelectComponent
  ],
  template: `
    <div class="demo-container">
      <h1>Radix-NG Migration Demo</h1>
      
      <!-- Example: Login Form Card -->
      <radix-card class="form-card">
        <div slot="header">
          <h2>Login Form</h2>
          <p>This form uses Radix-NG components instead of Angular Material</p>
        </div>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="form">
          <radix-input
            label="Email"
            type="email" 
            placeholder="Enter your email"
            formControlName="email"
            [required]="true"
            [errorMessage]="getErrorMessage('email')"
            hint="We'll never share your email">
          </radix-input>
          
          <radix-input
            label="Password"
            type="password"
            placeholder="Enter your password"
            formControlName="password"
            [required]="true"
            [errorMessage]="getErrorMessage('password')">
          </radix-input>
        </form>
        
        <div slot="footer">
          <radix-button 
            variant="outline" 
            (onClick)="onCancel()">
            Cancel
          </radix-button>
          
          <radix-button 
            variant="primary" 
            type="submit"
            [disabled]="loginForm.invalid"
            (onClick)="onSubmit()">
            Sign In
          </radix-button>
        </div>
      </radix-card>
      
      <!-- Example: Button Variants -->
      <radix-card class="button-demo">
        <div slot="header">
          <h2>Button Variants</h2>
          <p>All button variants available in the Radix system</p>
        </div>
        
        <div class="button-grid">
          <radix-button variant="primary" (onClick)="showAlert('Primary')">
            Primary
          </radix-button>
          
          <radix-button variant="secondary" (onClick)="showAlert('Secondary')">
            Secondary
          </radix-button>
          
          <radix-button variant="outline" (onClick)="showAlert('Outline')">
            Outline
          </radix-button>
          
          <radix-button variant="ghost" (onClick)="showAlert('Ghost')">
            Ghost
          </radix-button>
          
          <radix-button variant="destructive" (onClick)="showAlert('Destructive')">
            Delete
          </radix-button>
          
          <radix-button variant="primary" size="sm" (onClick)="showAlert('Small')">
            Small
          </radix-button>
          
          <radix-button variant="primary" size="lg" (onClick)="showAlert('Large')">
            Large Button
          </radix-button>
          
          <radix-button variant="primary" [disabled]="true">
            Disabled
          </radix-button>
        </div>
      </radix-card>

      <!-- Example: Form Controls -->
      <radix-card class="controls-demo">
        <div slot="header">
          <h2>Form Controls</h2>
          <p>Various form input types with Radix components</p>
        </div>
        
        <div class="controls-grid">
          <radix-checkbox
            label="Subscribe to newsletter"
            [(ngModel)]="isSubscribed">
          </radix-checkbox>
          
          <radix-select
            label="Country"
            [options]="countryOptions"
            [(ngModel)]="selectedCountry"
            placeholder="Select your country">
          </radix-select>
        </div>
      </radix-card>
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
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      padding: 16px 0;
    }

    .controls-demo {
      width: 100%;
    }

    .controls-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 16px 0;
    }

    [slot="header"] h2 {
      margin: 0 0 8px 0;
      color: #111827;
      font-size: 18px;
      font-weight: 600;
    }

    [slot="header"] p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }

    [slot="footer"] {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
  `]
})
export class RadixDemoComponent {
  loginForm: FormGroup;
  isSubscribed = false;
  selectedCountry = '';
  
  countryOptions: SelectOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' }
  ];

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log('Form submitted:', this.loginForm.value);
      alert('Form submitted successfully!');
    }
  }

  onCancel(): void {
    this.loginForm.reset();
    alert('Form cancelled');
  }

  showAlert(message: string): void {
    alert(`${message} button clicked!`);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }
}
