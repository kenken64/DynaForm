import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../auth/auth.service';
import { FormsService } from '../services/forms.service';
import { FormDataService } from '../services/form-data.service';
import { FormDataSubmission, FormDataResponse, GeneratedForm, FieldConfiguration } from '../interfaces/form.interface';
import { EditTitleDialogComponent, EditTitleDialogData } from '../forms-list/edit-title-dialog.component';

@Component({
    selector: 'app-form-viewer',
    templateUrl: './form-viewer.component.html',
    styleUrl: './form-viewer.component.css',
    standalone: false
})
export class FormViewerComponent implements OnInit, AfterViewInit {
  @Input() formId: string = '';
  @Input() showHeader: boolean = true; // Control whether to show header
  @Output() backToMain = new EventEmitter<void>();
  
  formData: any = null;
  loading = false;
  error = '';
  
  // View management
  currentView: 'form' | 'confirmation' = 'form';
  confirmationData: any = null;
  
  // Dynamic form properties (cloned from dashboard)
  dynamicForm!: FormGroup;
  fields: any[] = [];
  formTitle: string | null = null;
  originalFieldNameMap: Record<string, string> = {};
  objectKeys = Object.keys;
  
  // Field configuration options
  fieldConfigOptions = ['mandatory', 'validation'];
  fieldConfigurations: Record<string, string[]> = {};
  
  // Form saving status
  isSavingForm = false;
  isSavingFormData = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private formsService: FormsService,
    private authService: AuthService,
    private formDataService: FormDataService
  ) {
    // Initialize empty form to prevent template errors
    this.dynamicForm = this.fb.group({});
  }

  ngOnInit(): void {
    // Get form ID from route parameter if available
    const routeFormId = this.route.snapshot.paramMap.get('id');
    if (routeFormId) {
      this.formId = routeFormId;
    }
    
    if (this.formId) {
      this.loadForm();
    }
  }

  ngAfterViewInit(): void {
    // Ensure form controls are enabled after view initialization
    if (this.dynamicForm && Object.keys(this.dynamicForm.controls).length > 0) {
      this.enableAllFormControls();
    }
  }

  loadForm(): void {
    this.loading = true;
    this.error = '';

    this.formsService.getForm(this.formId).subscribe({
      next: (formData: any) => {
        this.loading = false;
        this.formData = formData;
        
        // Extract form data and build dynamic form
        if (this.formData && this.formData.formData) {
          this.fields = this.formData.formData;
          this.formTitle = this.formData.originalJson?.title || this.formData.metadata?.formName || null;
          this.fieldConfigurations = this.formData.fieldConfigurations || {};
          
          // Build the interactive form
          this.buildForm();
          
          // Force enable all controls after building
          setTimeout(() => {
            this.forceEnableAllControls();
          }, 100);
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Failed to load form. Please check if the form ID is correct.';
        console.error('Error loading form:', error);
      }
    });
  }

  onBackToMain(): void {
    this.backToMain.emit();
  }

  goBackToForms(): void {
    this.router.navigate(['/forms']);
  }

  // Form building logic (cloned from dashboard)
  buildForm(): void {
    const group: any = {};
    this.originalFieldNameMap = {};

    console.log('Building form with fields:', this.fields);

    this.fields.forEach(field => {
      // Normalize field types for backward compatibility
      field = this.normalizeFieldType(field);
      
      const sanitizedKey = this.sanitizeFieldName(field.name);
      this.originalFieldNameMap[sanitizedKey] = field.name;
      
      console.log(`Creating form control for: ${field.name} -> ${sanitizedKey} (type: ${field.type})`);

      // Create form control configurations for FormBuilder
      let initialValue = '';
      
      if (field.type === 'checkbox') {
        if (typeof field.value === 'object' && field.value !== null) {
          // Multiple checkbox options (checkbox group) - create as nested FormBuilder group
          const nestedGroupConfig: any = {};
          Object.entries(field.value).forEach(([key, val]) => {
            nestedGroupConfig[key] = val || false; // Use saved value or default to false
          });
          group[sanitizedKey] = this.fb.group(nestedGroupConfig);
        } else {
          // Single checkbox
          group[sanitizedKey] = field.value || false;
        }
      } else {
        // For all other field types (text, textarea, date, number, select)
        initialValue = field.value || '';
        group[sanitizedKey] = initialValue;
      }
    });

    // Create the form group using FormBuilder
    this.dynamicForm = this.fb.group(group);
    
    console.log('Dynamic form created:', this.dynamicForm);
    console.log('Form controls:', Object.keys(this.dynamicForm.controls));
  }

  // Normalize field types for backward compatibility
  normalizeFieldType(field: any): any {
    const normalizedField = { ...field };
    
    // Map 'text' to 'textbox' for consistency
    if (normalizedField.type === 'text') {
      normalizedField.type = 'textbox';
    }
    
    return normalizedField;
  }

  // Sanitize field names for form controls
  sanitizeFieldName(fieldName: string): string {
    if (!fieldName) return 'unnamed_field';
    return fieldName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase() || 'unnamed_field';
  }

  // Helper methods for field type detection (cloned from dashboard)
  isTextField(field: any): boolean {
    return (field.type === 'textbox' || field.type === 'text' || (!field.type && typeof field.value === 'string')) && 
           !this.isDateField(field) && !this.isNumericField(field);
  }

  isTextAreaField(field: any): boolean {
    return field.type === 'textarea';
  }

  isSignatureField(field: any): boolean {
    return field.type === 'signature';
  }

  isSingleCheckbox(field: any): boolean {
    return field.type === 'checkbox' && (typeof field.value !== 'object' || field.value === null);
  }

  isCheckboxGroup(field: any): boolean {
    return field.type === 'checkbox' && typeof field.value === 'object' && field.value !== null;
  }

  isDateField(field: any): boolean {
    // Check if explicitly marked as date type
    if (field.type === 'date') return true;
    
    // For textbox types, check the field name patterns
    if (field.type !== 'textbox' && field.type !== 'text') return false;
    
    const fieldName = field.name.toLowerCase().trim();
    
    // Exact match patterns (whole field name matches)
    const exactDateFields = [
      'date',
      'form date',
      'birth date',
      'start date',
      'end date',
      'expiry date',
      'from',
      'to',
      'period from',
      'period to',
      'leave from',
      'leave to',
      'effective from',
      'effective to',
      'date of birth'
    ];
    
    // Check for exact matches first
    if (exactDateFields.includes(fieldName)) {
      return true;
    }
    
    // Word boundary patterns (must be whole words, not substrings)
    const dateWordPatterns = [
      /\bdate\b/,
      /\bbirth\b/,
      /\bstart\b/,
      /\bend\b/,
      /\bexpiry\b/,
      /\bexpires\b/,
      /\bfrom\b/,
      /\bto\b/
    ];
    
    // Check if field name contains date-related whole words only
    return dateWordPatterns.some(pattern => pattern.test(fieldName));
  }

  isNumericField(field: any): boolean {
    if (field.type !== 'textbox' && field.type !== 'text') return false;
    
    const fieldName = field.name.toLowerCase().trim();
    
    // Exact match patterns for numeric fields
    const exactNumericFields = [
      'no.',
      'no',
      'number',
      'count',
      'total',
      'amount',
      'quantity',
      'total days',
      'no of days',
      'number of days',
      'leave days'
    ];
    
    // Check for exact matches first
    if (exactNumericFields.includes(fieldName)) {
      return true;
    }
    
    // Word boundary patterns for numeric fields
    const numericWordPatterns = [
      /\bno\.\b/,
      /\bnumber\b/,
      /\bdays\b/,
      /\bhours\b/,
      /\bamount\b/,
      /\bquantity\b/,
      /\bcount\b/,
      /\btotal\b/
    ];
    
    // Check if field name contains numeric-related whole words only
    return numericWordPatterns.some(pattern => pattern.test(fieldName));
  }

  // Form control helper methods
  isFormControl(fieldName: string): boolean {
    const control = this.dynamicForm.get(fieldName);
    return !!control && !(control instanceof FormGroup);
  }

  getFormControl(fieldName: string): FormControl {
    return this.dynamicForm.get(fieldName) as FormControl;
  }

  getNestedGroup(fieldName: string): FormGroup {
    return this.dynamicForm.get(fieldName) as FormGroup;
  }

  hasFormControl(fieldName: string): boolean {
    if (!this.dynamicForm) {
      return false;
    }
    const control = this.dynamicForm.get(fieldName);
    return control !== null && control !== undefined;
  }

  // Method to enable all form controls
  private enableAllFormControls(): void {
    Object.keys(this.dynamicForm.controls).forEach(controlName => {
      const control = this.dynamicForm.get(controlName);
      if (control) {
        if (control instanceof FormGroup) {
          // For nested form groups (like checkbox groups)
          Object.keys(control.controls).forEach(nestedControlName => {
            const nestedControl = control.get(nestedControlName);
            if (nestedControl && nestedControl.disabled) {
              nestedControl.enable();
            }
          });
        } else {
          // For regular form controls
          if (control.disabled) {
            control.enable();
          }
        }
      }
    });
  }

  // Public method to force enable all controls
  public forceEnableAllControls(): void {
    if (!this.dynamicForm) {
      return;
    }
    
    Object.keys(this.dynamicForm.controls).forEach(controlName => {
      const control = this.dynamicForm.get(controlName);
      if (control) {
        if (control instanceof FormGroup) {
          // For nested form groups (like checkbox groups)
          Object.keys(control.controls).forEach(nestedControlName => {
            const nestedControl = control.get(nestedControlName);
            if (nestedControl) {
              nestedControl.enable();
            }
          });
          control.enable();
        } else {
          // For regular form controls
          control.enable();
        }
      }
    });
    
    // Also enable the form itself
    this.dynamicForm.enable();
  }

  // Field configuration methods
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

  // Check if field has relevant configurations (mandatory or validation only)
  hasRelevantConfiguration(fieldName: string): boolean {
    const configs = this.getFieldConfiguration(fieldName);
    return configs.includes('mandatory') || configs.includes('validation');
  }

  // Get only relevant configurations (mandatory and validation)
  getRelevantConfigurations(fieldName: string): string[] {
    const configs = this.getFieldConfiguration(fieldName);
    return configs.filter(config => config === 'mandatory' || config === 'validation');
  }

  updateFieldConfiguration(fieldName: string, configurations: string[]): void {
    this.fieldConfigurations[fieldName] = configurations;
  }

  // Form submission
  onSubmit(): void {
    const formData = this.dynamicForm.value;
    console.log('Updated Form Data:', formData);
    
    // Process and format the form data
    const processedData: any = {};
    const updatedFields: any[] = [];
    
    this.fields.forEach(field => {
      const sanitizedKey = this.sanitizeFieldName(field.name);
      const originalName = field.name;
      const value = formData[sanitizedKey];
      
      // Create updated form field object
      const updatedField = {
        ...field,
        value: value,
        configuration: {
          mandatory: this.getFieldConfiguration(field.name).includes('mandatory'),
          validation: this.getFieldConfiguration(field.name).includes('validation')
        }
      };
      
      updatedFields.push(updatedField);
    });
    
    // Transform fieldConfigurations to match the interface
    const transformedFieldConfigurations: Record<string, FieldConfiguration> = {};
    Object.entries(this.fieldConfigurations).forEach(([fieldName, configArray]) => {
      transformedFieldConfigurations[fieldName] = {
        mandatory: configArray.includes('mandatory'),
        validation: configArray.includes('validation')
      };
    });

    // Prepare data for backend update
    const updateFormData = {
      formData: updatedFields,
      fieldConfigurations: transformedFieldConfigurations,
      originalJson: this.formData.originalJson,
      metadata: {
        ...this.formData.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    
    console.log('Updating form data:', updateFormData);
    
    // Save updated form to backend
    this.isSavingForm = true;
    
    this.formsService.updateForm(this.formId, updateFormData).subscribe({
      next: (response: any) => {
        this.isSavingForm = false;
        console.log('Form updated successfully:', response);
        alert('Form updated successfully!');
      },
      error: (error) => {
        this.isSavingForm = false;
        console.error('Error updating form:', error);
        alert('Failed to update form. Please try again.');
      }
    });
  }

  // Save form data submission to forms_data collection
  saveFormData(): void {
    const formData = this.dynamicForm.value;
    console.log('Saving form data submission:', formData);
    
    // Process and format the form data for submission
    const processedFormData: Record<string, any> = {};
    
    this.fields.forEach(field => {
      const sanitizedKey = this.sanitizeFieldName(field.name);
      const value = formData[sanitizedKey];
      
      // Store both original field name and sanitized value
      processedFormData[field.name] = {
        fieldName: field.name,
        fieldType: field.type,
        value: value,
        sanitizedKey: sanitizedKey
      };
    });
    
    // Debug current user data
    const currentUser = this.authService.getCurrentUser();
    console.log('Current user data during form submission:', currentUser);
    console.log('Auth service authenticated status:', this.authService.isAuthenticated());
    
    // Prepare submission data with proper typing
    const submissionData: FormDataSubmission = {
      formId: this.formId,
      formTitle: this.formTitle || this.formData.originalJson?.title || 'Untitled Form',
      formData: processedFormData,
      userInfo: {
        userId: this.authService.getCurrentUser()?.id || this.authService.getCurrentUser()?.username || 'anonymous',
        username: this.authService.getCurrentUser()?.username || 'anonymous',
        submittedBy: this.authService.getCurrentUser()?.username || this.authService.getCurrentUser()?.name || 'Unknown User'
      },
      submissionMetadata: {
        formVersion: this.formData.metadata?.version || '1.0.0',
        totalFields: this.fields.length,
        filledFields: Object.values(processedFormData).filter((field: any) => 
          field.value !== null && field.value !== undefined && field.value !== ''
        ).length
      }
    };
    
    console.log('Submission payload:', submissionData);
    
    // Save form data submission to backend
    this.isSavingFormData = true;
    
    this.formDataService.submitFormData(submissionData).subscribe({
      next: (response: FormDataResponse) => {
        this.isSavingFormData = false;
        console.log('Form data saved successfully:', response);
        
        // Prepare confirmation data
        this.confirmationData = {
          formId: this.formId,
          formTitle: this.formTitle || 'Untitled Form',
          submissionId: response.formId || 'unknown', // Use formId from response
          submittedAt: response.submittedAt || new Date().toISOString(),
          isUpdate: !response.isNewSubmission,
          filledFields: submissionData.submissionMetadata.filledFields,
          totalFields: submissionData.submissionMetadata.totalFields
        };
        
        // Switch to confirmation view
        this.currentView = 'confirmation';
      },
      error: (error) => {
        this.isSavingFormData = false;
        console.error('Error saving form data:', error);
        alert('Failed to save form data. Please try again.');
      }
    });
  }

  // Dialog-based title editing
  editFormTitle(): void {
    if (!this.formData) return;

    const dialogData: EditTitleDialogData = {
      currentTitle: this.formData.metadata.formName || 'Untitled Form',
      formId: this.formData._id
    };

    const dialogRef = this.dialog.open(EditTitleDialogComponent, {
      width: '400px',
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(newTitle => {
      if (newTitle && newTitle !== this.formData.metadata.formName) {
        this.updateFormTitle(newTitle);
      }
    });
  }

  private updateFormTitle(newTitle: string): void {
    const updateData = {
      metadata: {
        ...this.formData.metadata,
        formName: newTitle
      }
    };

    this.formsService.updateForm(this.formData._id, updateData).subscribe({
      next: (updatedForm) => {
        // Update the local form data
        this.formData.metadata.formName = updatedForm.metadata.formName;
        this.formTitle = updatedForm.metadata.formName;
      },
      error: (error) => {
        console.error('Error updating form title:', error);
        alert('Failed to update form title. Please try again.');
      }
    });
  }

  // Confirmation page navigation methods
  onBackToForm(): void {
    this.currentView = 'form';
    this.confirmationData = null;
  }

  onViewFormData(): void {
    // Navigate to view submitted form data (could open a dialog or navigate to another page)
    console.log('View form data clicked for submission:', this.confirmationData?.submissionId);
    // For now, just go back to form view
    this.onBackToForm();
  }

  onGoToFormsList(): void {
    // Navigate to the form data list component instead of forms list
    this.router.navigate(['/form-data']);
  }
}
