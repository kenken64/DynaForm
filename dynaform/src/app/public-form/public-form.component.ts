import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GeneratedForm, FieldConfiguration, FieldConfigurationValue } from '../interfaces/form.interface';

@Component({
  selector: 'app-public-form',
  templateUrl: './public-form.component.html',
  styleUrls: ['./public-form.component.css']
})
export class PublicFormComponent implements OnInit {
  formData: GeneratedForm | null = null;
  loading = false;
  saving = false;
  error = '';
  
  // Form parameters from URL
  formId: string = '';
  jsonFingerprint: string = '';
  
  // Dynamic form properties
  dynamicForm!: FormGroup;
  fields: any[] = [];
  formTitle: string = '';
  fieldConfigurations: Record<string, FieldConfigurationValue> = {};
  
  // Utility
  objectKeys = Object.keys;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {
    // Initialize empty form to prevent template errors
    this.dynamicForm = this.fb.group({});
  }

  ngOnInit(): void {
    // Get parameters from route
    this.formId = this.route.snapshot.paramMap.get('formId') || '';
    this.jsonFingerprint = this.route.snapshot.paramMap.get('fingerprint') || '';
    
    if (this.formId && this.jsonFingerprint) {
      this.loadForm();
    } else {
      this.error = 'Invalid form parameters. Both form ID and JSON fingerprint are required.';
    }
  }

  loadForm(): void {
    this.loading = true;
    this.error = '';

    // Direct HTTP call instead of service
    this.http.get<GeneratedForm>(`/api/public/forms?formId=${this.formId}&jsonFingerprint=${this.jsonFingerprint}`).subscribe({
      next: (formData: GeneratedForm) => {
        this.loading = false;
        this.formData = formData;
        
        // Extract form data and build dynamic form
        if (this.formData && this.formData.formData) {
          this.fields = this.formData.formData;
          this.formTitle = this.formData.originalJson?.title || this.formData.metadata?.formName || 'Public Form';
          this.fieldConfigurations = this.formData.fieldConfigurations || {};
          
          // Build the interactive form
          this.buildForm();
          
          // Force enable all controls after building
          setTimeout(() => {
            this.forceEnableAllControls();
          }, 100);
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error loading public form:', error);
        
        // Provide user-friendly error messages instead of technical details
        if (error.status === 400) {
          this.error = 'The form link appears to be invalid. Please check the URL and try again.';
        } else if (error.status === 404) {
          this.error = 'Form not found or not yet verified. This form may not be publicly available yet or the verification process is still in progress.';
        } else if (error.status === 0) {
          this.error = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else {
          this.error = 'Unable to load the form at this time. Please try again later.';
        }
      }
    });
  }

  buildForm(): void {
    const group: any = {};

    this.fields.forEach(field => {
      const sanitizedName = this.sanitizeFieldName(field.name);
      const validators = [];
      
      // Add required validator if field is mandatory
      if (this.getFieldConfiguration(field.name).includes('mandatory')) {
        validators.push(Validators.required);
      }

      // Initialize with appropriate default value
      let defaultValue: any = '';
      if (field.type === 'checkbox' && this.isCheckboxGroup(field)) {
        defaultValue = {}; // For checkbox groups
      } else if (field.type === 'checkbox') {
        defaultValue = false; // For single checkboxes
      }

      group[sanitizedName] = new FormControl(defaultValue, validators);
    });

    this.dynamicForm = this.fb.group(group);
  }

  forceEnableAllControls(): void {
    Object.keys(this.dynamicForm.controls).forEach(key => {
      const control = this.dynamicForm.get(key);
      if (control) {
        control.enable();
      }
    });
  }

  sanitizeFieldName(fieldName: string): string {
    return fieldName.replace(/[^a-zA-Z0-9_]/g, '_')
                   .replace(/^[0-9]/, '_$&')
                   .replace(/_{2,}/g, '_');
  }

  getFieldConfiguration(fieldName: string): string[] {
    const config = this.fieldConfigurations[fieldName];
    
    // Handle different field configuration formats for backward compatibility
    if (!config) {
      return [];
    }
    
    // Handle object format: { mandatory: boolean, validation: boolean }
    if (typeof config === 'object' && config !== null && !Array.isArray(config)) {
      const result: string[] = [];
      const configObj = config as any; // Type assertion for flexibility
      if (configObj.mandatory) result.push('mandatory');
      if (configObj.validation) result.push('validation');
      return result;
    }
    
    // Handle legacy array format: ['mandatory', 'validation'] or []
    if (Array.isArray(config)) {
      return config;
    }
    
    // Fallback for unknown formats
    return [];
  }

  hasRelevantConfiguration(fieldName: string): boolean {
    const configs = this.getFieldConfiguration(fieldName);
    return configs.includes('mandatory') || configs.includes('validation');
  }

  getRelevantConfigurations(fieldName: string): string[] {
    const configs = this.getFieldConfiguration(fieldName);
    return configs.filter(config => config === 'mandatory' || config === 'validation');
  }

  isTextAreaField(field: any): boolean {
    const fieldNameLower = field.name.toLowerCase();
    return fieldNameLower.includes('reason') || 
           fieldNameLower.includes('description') ||
           fieldNameLower.includes('comment') ||
           fieldNameLower.includes('notes') ||
           fieldNameLower.includes('details') ||
           fieldNameLower.includes('address') ||
           fieldNameLower.includes('message');
  }

  isSignatureField(field: any): boolean {
    const fieldNameLower = field.name.toLowerCase();
    return fieldNameLower.includes('signature') || fieldNameLower.includes('sign');
  }

  isDateField(field: any): boolean {
    const fieldNameLower = field.name.toLowerCase();
    return fieldNameLower.includes('date') || 
           fieldNameLower.includes('birthday') ||
           fieldNameLower.includes('birth') ||
           field.type === 'date';
  }

  isNumericField(field: any): boolean {
    const fieldNameLower = field.name.toLowerCase();
    return fieldNameLower.includes('number') ||
           fieldNameLower.includes('amount') ||
           fieldNameLower.includes('price') ||
           fieldNameLower.includes('cost') ||
           fieldNameLower.includes('salary') ||
           fieldNameLower.includes('age') ||
           fieldNameLower.includes('phone') ||
           fieldNameLower.includes('mobile') ||
           fieldNameLower.includes('zip') ||
           fieldNameLower.includes('postal') ||
           field.type === 'number';
  }

  isCheckboxGroup(field: any): boolean {
    return field.type === 'checkbox' && field.options && Array.isArray(field.options) && field.options.length > 1;
  }

  onSubmit(): void {
    if (this.dynamicForm.valid) {
      this.saveFormData();
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  saveFormData(): void {
    this.saving = true;
    
    const formSubmissionData = {
      formId: this.formId,
      jsonFingerprint: this.jsonFingerprint,
      submissionData: this.dynamicForm.value,
      submittedAt: new Date().toISOString()
    };

    this.http.post<any>('/api/public/forms/submit', formSubmissionData).subscribe({
      next: (response: any) => {
        this.saving = false;
        this.snackBar.open('Form submitted successfully!', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        
        // Optionally reset the form or navigate away
        this.dynamicForm.reset();
      },
      error: (error: any) => {
        this.saving = false;
        console.error('Error saving form data:', error);
        this.snackBar.open('Failed to submit form. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.dynamicForm.controls).forEach(key => {
      const control = this.dynamicForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }
}
