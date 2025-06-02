import { Component, AfterViewInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PdfUploadService } from '../pdf-upload.service';
import { DescribeImageService } from '../describe-image.service';
import { FormsService } from '../services/forms.service';
import { GeneratedForm, FieldConfiguration } from '../interfaces/form.interface';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements AfterViewInit {
  title = 'dynaform';
  selectedFile: File | null = null;
  uploadMessage: string = '';
  imageUrls: string[] = [];
  generatedImageUrl: string | null = null;
  originalFieldNameMap: Record<string, string> = {};
  formTitle: string | null = null; // Add form title property

  dynamicForm!: FormGroup;
  fields: any[] = [];
  loading = false;
  error = '';
  objectKeys = Object.keys;
  isFetchingForm = false;
  isUploadingPdf = false; // Add upload status tracking
  
  // Drag and drop functionality
  isDragOver = false;

  // Field configuration options
  fieldConfigOptions = ['mandatory', 'validation'];
  fieldConfigurations: Record<string, string[]> = {};
  
  // Form saving status
  isSavingForm = false;
  
  // View state management
  currentView: 'form' | 'confirmation' | 'viewer' = 'form';
  savedFormData: {
    formId: string;
    formName: string;
    savedAt: string;
  } | null = null;
  viewerFormId: string = '';

  // Side menu state
  isSideMenuCollapsed = false;
  selectedFormFromMenu: GeneratedForm | null = null;

  constructor(
    private pdfUploadService: PdfUploadService,
    private fb: FormBuilder, 
    private describeService: DescribeImageService,
    private http: HttpClient,
    private formsService: FormsService // Inject FormsService
  ) { 
    // Initialize empty form to prevent template errors
    this.dynamicForm = this.fb.group({});
  }

  // Utility method to clean up duplicate words in titles
  private cleanupTitle(title: string | null): string | null {
    if (!title) return null;
    
    // Split the title into words, remove duplicates while preserving order
    const words = title.split(/\s+/);
    const cleanWords: string[] = [];
    const seen = new Set<string>();
    
    for (const word of words) {
      const lowerWord = word.toLowerCase();
      if (!seen.has(lowerWord)) {
        seen.add(lowerWord);
        cleanWords.push(word);
      }
    }
    
    return cleanWords.join(' ').trim();
  }

  ngAfterViewInit(): void {
    // Ensure form controls are enabled after view initialization
    if (this.dynamicForm && Object.keys(this.dynamicForm.controls).length > 0) {
      this.enableAllFormControls();
    }
  }

  // Helper method to convert absolute URLs to relative URLs for production
  private normalizeImageUrl(url: string): string {
    if (environment.production) {
      // Convert absolute URLs to relative URLs
      // From: http://localhost/conversion/generated_images/...
      // To: /conversion/generated_images/...
      try {
        const urlObj = new URL(url);
        return urlObj.pathname;
      } catch {
        // If URL parsing fails, return as-is
        return url;
      }
    }
    return url;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.processSelectedFile(file);
    } else {
      this.selectedFile = null;
      this.uploadMessage = '';
    }
  }  uploadPdf(): void {
    // Enhanced validation
    if (!this.selectedFile) {
      this.uploadMessage = 'Please select a PDF file first.';
      return;
    }

    // Validate file type
    if (this.selectedFile.type !== 'application/pdf') {
      this.uploadMessage = 'Please select a valid PDF file.';
      return;
    }

    // Validate file size (optional - e.g., max 10MB)
    const maxSizeInMB = 10;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (this.selectedFile.size > maxSizeInBytes) {
      this.uploadMessage = `File size must be less than ${maxSizeInMB}MB. Selected file is ${(this.selectedFile.size / 1024 / 1024).toFixed(2)}MB.`;
      return;
    }

    // Clear any previous errors and show uploading status
    this.error = '';
    this.uploadMessage = 'Uploading PDF file...';
    this.isUploadingPdf = true;

    this.pdfUploadService.uploadPdf(this.selectedFile).subscribe({
      next: response => {
        this.isUploadingPdf = false;
        this.uploadMessage = `Upload successful! File "${this.selectedFile?.name}" has been processed.`;
        console.log(response?.accessible_urls[0]);
        // Normalize URLs for production environment
        this.imageUrls = response.accessible_urls.map(url => this.normalizeImageUrl(url));
        this.generatedImageUrl = this.imageUrls[0];
        console.log('Normalized image URLs:', this.imageUrls);
        console.log('Generated image URL:', this.generatedImageUrl);
      },
      error: err => {
        this.isUploadingPdf = false;
        console.error(err);
        this.uploadMessage = 'Upload failed. Please try again with a different PDF file.';
        this.imageUrls = [];
        this.error = 'Failed to upload PDF. Please check your file and try again.';
      }
    });
  }
  fetchImageAndDescribe(): void {
    this.isFetchingForm = true; // Start spinner
    this.error = ''; // Clear any previous errors
    
    if (!this.generatedImageUrl) {
      this.isFetchingForm = false; // Stop spinner if no image URL
      this.error = 'No image URL available.';
      return;
    }

    this.loading = true;

    fetch(this.generatedImageUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'form_image.png', { type: blob.type });

        this.describeService.describeImage(file).subscribe({
          next: (res: any) => {
            try {
              const jsonStr = res.description.match(/```json\s*([\s\S]*?)```/)?.[1];
              if (!jsonStr) {
                this.error = 'Failed to extract JSON from response.';
                this.loading = false;
                this.isFetchingForm = false; // Stop spinner on error
                return;
              }
              console.log('Received JSON:', jsonStr);
              const parsed = JSON.parse(jsonStr);
              const formData = parsed.forms[0];
              this.formTitle = this.cleanupTitle(formData.title); // Extract and clean form title
              this.fields = formData.fields || [];
              
              // Ensure Form Date field exists before building form
              this.ensureFormDateField();
              
              this.buildForm();
              
              // Force enable all controls after building
              setTimeout(() => {
                this.forceEnableAllControls();
              }, 100);
              
              this.loading = false;
              this.isFetchingForm = false; // Stop spinner on success
            } catch (parseError) {
              this.error = 'Failed to parse JSON response.';
              this.loading = false;
              this.isFetchingForm = false; // Stop spinner on parse error
            }
          },          error: (err: any) => {
            console.error('Image description error:', err);
            // Provide more specific error messages based on error type
            if (err.status === 404) {
              this.error = 'The AI model is not available. Please ensure the Ollama service is running with the required model.';
            } else if (err.status === 500) {
              this.error = 'Internal server error during image analysis. Please try again.';
            } else if (err.error?.message?.includes('model') && err.error?.message?.includes('not found')) {
              this.error = 'AI model not found. The required model may still be downloading.';
            } else {
              this.error = 'Error during image description. Please try again.';
            }
            this.loading = false;
            this.isFetchingForm = false; // Stop spinner on error
          }
        });
      })
      .catch(fetchError => {
        console.error('Image fetch error:', fetchError);
        this.error = 'Failed to fetch image.';
        this.loading = false;
        this.isFetchingForm = false; // Stop spinner on fetch error
      });
  }

  buildForm(): void {
    const group: any = {};
    this.originalFieldNameMap = {};

    console.log('Building form with fields:', this.fields);

    this.fields.forEach(field => {
      const sanitizedKey = this.sanitizeFieldName(field.name);
      this.originalFieldNameMap[sanitizedKey] = field.name;
      
      console.log(`Creating form control for: ${field.name} -> ${sanitizedKey} (type: ${field.type})`);

      // Create form control configurations (not instances) for FormBuilder
      let initialValue = '';
      
      if (field.type === 'checkbox') {
        if (typeof field.value === 'object' && field.value !== null) {
          // Multiple checkbox options (checkbox group) - create as nested FormBuilder group
          const nestedGroupConfig: any = {};
          Object.entries(field.value).forEach(([key, val]) => {
            nestedGroupConfig[key] = false; // Just the default value for FormBuilder
          });
          group[sanitizedKey] = this.fb.group(nestedGroupConfig); // Create nested FormGroup directly
        } else {
          // Single checkbox
          group[sanitizedKey] = false; // Just the default value
        }
      } else {
        // For all other field types (text, textarea, date, number)
        initialValue = field.value || '';
        group[sanitizedKey] = initialValue; // Just the default value for FormBuilder
      }
    });

    // Create the form group using FormBuilder
    this.dynamicForm = this.fb.group(group);
    
    // Initialize field configurations
    this.initializeFieldConfigurations();
    
    console.log('Dynamic form created:', this.dynamicForm);
    console.log('Form controls:', Object.keys(this.dynamicForm.controls));
    console.log('Form status:', this.dynamicForm.status);
    console.log('Form enabled:', this.dynamicForm.enabled);
    
    // Call debug method to check form structure
    this.checkFormControls();
    
    // Log each control's status
    Object.keys(this.dynamicForm.controls).forEach(controlName => {
      const control = this.dynamicForm.get(controlName);
      console.log(`Control ${controlName}:`, {
        enabled: control?.enabled,
        disabled: control?.disabled,
        status: control?.status,
        value: control?.value
      });
    });
  }

  // Method to explicitly enable all form controls
  private enableAllFormControls(): void {
    Object.keys(this.dynamicForm.controls).forEach(controlName => {
      const control = this.dynamicForm.get(controlName);
      if (control) {
        if (control instanceof FormGroup) {
          // For nested form groups (like checkbox groups)
          Object.keys(control.controls).forEach(nestedControlName => {
            const nestedControl = control.get(nestedControlName);
            if (nestedControl && nestedControl.disabled) {
              console.log(`Enabling nested control: ${controlName}.${nestedControlName}`);
              nestedControl.enable();
            }
          });
        } else {
          // For regular form controls
          if (control.disabled) {
            console.log(`Enabling control: ${controlName}`);
            control.enable();
          }
        }
      }
    });
    
    console.log('All form controls have been checked and enabled');
  }

  // Public method to force enable all controls (can be called from template or externally)
  public forceEnableAllControls(): void {
    if (!this.dynamicForm) {
      console.warn('Dynamic form not initialized');
      return;
    }
    
    console.log('Force enabling all form controls...');
    Object.keys(this.dynamicForm.controls).forEach(controlName => {
      const control = this.dynamicForm.get(controlName);
      if (control) {
        if (control instanceof FormGroup) {
          // For nested form groups (like checkbox groups)
          Object.keys(control.controls).forEach(nestedControlName => {
            const nestedControl = control.get(nestedControlName);
            if (nestedControl) {
              nestedControl.enable();
              console.log(`Force enabled nested control: ${controlName}.${nestedControlName}`);
            }
          });
          control.enable(); // Enable the parent group as well
        } else {
          // For regular form controls
          control.enable();
          console.log(`Force enabled control: ${controlName}`);
        }
      }
    });
    
    // Also enable the form itself
    this.dynamicForm.enable();
    console.log('All form controls have been force enabled');
  }

  // Method to ensure the form is enabled (called during template rendering)
  private ensureFormIsEnabled(): void {
    if (!this.dynamicForm) return;
    
    // Quick check and enable if needed (without verbose logging)
    Object.keys(this.dynamicForm.controls).forEach(controlName => {
      const control = this.dynamicForm.get(controlName);
      if (control && control.disabled) {
        control.enable();
      }
    });
    
    if (this.dynamicForm.disabled) {
      this.dynamicForm.enable();
    }
  }

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

  // Helper method to check if form control exists
  hasFormControl(fieldName: string): boolean {
    if (!this.dynamicForm) {
      console.warn(`Dynamic form not initialized when checking for control: ${fieldName}`);
      return false;
    }
    const control = this.dynamicForm.get(fieldName);
    const exists = control !== null && control !== undefined;
    if (!exists) {
      console.warn(`Form control not found: ${fieldName}. Available controls:`, Object.keys(this.dynamicForm.controls));
    }
    return exists;
  }

  // Helper methods to determine field types
  isTextField(field: any): boolean {
    return (field.type === 'textbox' || field.type === 'text' || (!field.type && typeof field.value === 'string')) && 
           !this.isDateField(field) && !this.isNumericField(field);
  }

  isTextAreaField(field: any): boolean {
    return field.type === 'textarea';
  }

  isSingleCheckbox(field: any): boolean {
    return field.type === 'checkbox' && (typeof field.value !== 'object' || field.value === null);
  }

  isCheckboxGroup(field: any): boolean {
    return field.type === 'checkbox' && typeof field.value === 'object' && field.value !== null;
  }

  // Helper method to detect date fields based on field name
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

  // Helper method to detect leave period fields
  isLeavePeriodField(field: any): boolean {
    const fieldName = field.name.toLowerCase().trim();
    const leavePeriodKeywords = ['from', 'to', 'no. of days', 'no of days', 'number of days', 'leave days', 'period'];
    return leavePeriodKeywords.some(keyword => fieldName.includes(keyword));
  }

  // Helper method to ensure Form Date field exists without rebuilding form
  private ensureFormDateField(): void {
    // Check if Form Date field already exists
    const formDateField = this.fields.find(f => {
      const fieldName = f.name.toLowerCase().trim();
      return fieldName.includes('form date') || 
             fieldName === 'date' || 
             (fieldName.includes('date') && this.fields.indexOf(f) <= 2);
    });
    
    // If no form date field was found, create one
    if (!formDateField) {
      const newFormDateField = {
        name: 'Form Date',
        type: 'date',
        value: ''
      };
      // Add it to the beginning of the fields array
      this.fields.unshift(newFormDateField);
    }
  }

  // Helper method to group related fields for better visual organization
  getFieldGroups(): any[] {
    if (!this.fields || this.fields.length === 0) {
      return [];
    }
    
    // Ensure all form controls are enabled when grouping fields
    if (this.dynamicForm && Object.keys(this.dynamicForm.controls).length > 0) {
      this.ensureFormIsEnabled();
    }
    
    const groups: any[] = [];
    
    // Find form date field (should already exist from ensureFormDateField)
    const formDateField = this.fields.find(f => {
      const fieldName = f.name.toLowerCase().trim();
      return fieldName.includes('form date') || 
             fieldName === 'date' || 
             (fieldName.includes('date') && this.fields.indexOf(f) <= 2);
    });
    
    // Check if we have the classic leave period trio: From, To, No. of days
    const fromField = this.fields.find(f => f.name.toLowerCase().trim() === 'from');
    const toField = this.fields.find(f => f.name.toLowerCase().trim() === 'to');
    const daysField = this.fields.find(f => 
      f.name.toLowerCase().includes('no. of days') || 
      f.name.toLowerCase().includes('no of days') ||
      f.name.toLowerCase().includes('number of days')
    );
    
    const leavePeriodFields = [fromField, toField, daysField].filter(f => f);
    
    // Process fields in their original order
    let i = 0;
    while (i < this.fields.length) {
      const field = this.fields[i];
      
      // Skip form date field if it's not at the beginning, we'll add it first
      if (field === formDateField && i > 0) {
        i++;
        continue;
      }
      
      // Check if this is the start of a leave period sequence
      if (field === fromField && leavePeriodFields.length === 3) {
        // Find the indices of all leave period fields
        const fromIndex = this.fields.indexOf(fromField);
        const toIndex = this.fields.indexOf(toField);
        const daysIndex = this.fields.indexOf(daysField);
        
        // Check if they appear consecutively or in close proximity
        const indices = [fromIndex, toIndex, daysIndex].sort((a, b) => a - b);
        const isConsecutive = indices[2] - indices[0] <= 4; // Allow up to 4 positions apart
        
        if (isConsecutive && i === indices[0]) {
          // Create leave period group
          groups.push({
            type: 'leave-period',
            title: 'Leave Period',
            fields: [fromField, toField, daysField]
          });
          
          // Skip to after the last leave period field
          i = indices[2] + 1;
          continue;
        }
      }
      
      // Regular single field
      groups.push({
        type: 'single',
        fields: [field]
      });
      
      i++;
    }
    
    // Ensure form date appears at the beginning if found
    if (formDateField) {
      const formDateGroup = {
        type: 'single',
        fields: [formDateField]
      };
      
      // Remove form date from groups if it exists elsewhere
      const existingIndex = groups.findIndex(g => 
        g.fields && g.fields.includes(formDateField)
      );
      if (existingIndex !== -1) {
        groups.splice(existingIndex, 1);
      }
      
      // Add form date at the beginning
      groups.unshift(formDateGroup);
    }
    
    return groups;
  }

  // Helper method to detect numeric fields
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

  onSubmit(): void {
    const formData = this.dynamicForm.value;
    console.log('Submitted Form Data:', formData);
    
    // Process and format the form data for better readability
    const processedData: any = {};
    const formFields: any[] = [];
    
    this.fields.forEach(field => {
      const sanitizedKey = this.sanitizeFieldName(field.name);
      const originalName = field.name;
      const value = formData[sanitizedKey];
      
      // Create structured form field object
      const formField = {
        name: originalName,
        type: field.type,
        value: value,
        configuration: {
          mandatory: this.getFieldConfiguration(field.name).includes('mandatory'),
          validation: this.getFieldConfiguration(field.name).includes('validation')
        }
      };
      
      if (field.type === 'checkbox' && typeof field.value === 'object') {
        // For checkbox groups, include options
        formField.value = value;
        const selectedOptions = Object.entries(value)
          .filter(([key, val]) => val === true)
          .map(([key, val]) => key);
        processedData[originalName] = {
          type: 'checkbox_group',
          selected: selectedOptions,
          all_options: Object.keys(field.value)
        };
      } else if (field.type === 'checkbox') {
        // For single checkbox
        processedData[originalName] = {
          type: 'single_checkbox',
          checked: !!value
        };
      } else {
        // For text and textarea fields
        processedData[originalName] = {
          type: field.type || 'text',
          value: value
        };
      }
      
      formFields.push(formField);
    });
    
    console.log('Processed Form Data:', processedData);
    
    // Prepare data for backend
    const saveFormData = {
      formData: formFields,
      fieldConfigurations: this.fieldConfigurations,
      originalJson: {
        title: this.formTitle,
        fields: this.fields
      },
      metadata: {
        formName: this.formTitle || 'Generated Form',
        createdAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
    console.log('Saving form data to backend:', saveFormData);
    
    // Save to backend
    this.isSavingForm = true;
    
    this.formsService.saveForm(saveFormData).subscribe({
      next: (response: any) => {
        this.isSavingForm = false;
        console.log('Form saved successfully:', response);
        
        // Convert fieldConfigurations to proper format
        const formattedFieldConfigurations: Record<string, FieldConfiguration> = {};
        Object.keys(this.fieldConfigurations).forEach(fieldName => {
          const configs = this.fieldConfigurations[fieldName];
          formattedFieldConfigurations[fieldName] = {
            mandatory: configs.includes('mandatory'),
            validation: configs.includes('validation')
          };
        });
        
        // Create the form object that was saved
        const savedForm: GeneratedForm = {
          _id: response.data.formId,
          formData: formFields,
          fieldConfigurations: formattedFieldConfigurations,
          metadata: {
            formName: this.formTitle || 'Generated Form',
            createdAt: new Date().toISOString(),
            version: '1.0.0'
          }
        };

        // Add to FormsService cache to trigger auto-refresh
        this.formsService.addFormToCache(savedForm);
        
        // Store saved form data and show confirmation page
        this.savedFormData = {
          formId: response.data.formId,
          formName: this.formTitle || 'Generated Form',
          savedAt: new Date().toISOString()
        };
        this.currentView = 'confirmation';
      },
      error: (error) => {
        this.isSavingForm = false;
        console.error('Error saving form:', error);
        alert('Failed to save form. Please check the console for details.');
      }
    });
  }

  // Navigation methods for view management
  onViewForm(formId: string): void {
    this.viewerFormId = formId;
    this.currentView = 'viewer';
  }

  onCreateNewForm(): void {
    // Reset all form data and return to main form view
    this.currentView = 'form';
    this.savedFormData = null;
    this.viewerFormId = '';
    this.fields = [];
    this.dynamicForm = this.fb.group({});
    this.formTitle = null;
    this.fieldConfigurations = {};
    this.selectedFile = null;
    this.uploadMessage = '';
    this.imageUrls = [];
    this.generatedImageUrl = null;
    this.error = '';
  }

  onBackToMain(): void {
    this.currentView = 'form';
    this.viewerFormId = '';
  }

  sanitizeFieldName(name: string): string {
    const sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
    console.log(`Sanitizing field name: "${name}" -> "${sanitized}"`);
    return sanitized;
  }

  // Method to clear error state and retry
  clearError(): void {
    this.error = '';
  }

  // Method to retry form generation
  retryFormGeneration(): void {
    this.clearError();
    this.fetchImageAndDescribe();
  }

  // Debug method to check form control validity
  checkFormControls(): void {
    console.log('=== FORM CONTROLS DEBUG ===');
    console.log('Dynamic Form:', this.dynamicForm);
    console.log('Form valid:', this.dynamicForm?.valid);
    console.log('Form status:', this.dynamicForm?.status);
    console.log('Form errors:', this.dynamicForm?.errors);
    
    if (this.dynamicForm) {
      Object.keys(this.dynamicForm.controls).forEach(controlName => {
        const control = this.dynamicForm.get(controlName);
        console.log(`Control "${controlName}":`, {
          type: control?.constructor.name,
          value: control?.value,
          valid: control?.valid,
          status: control?.status,
          enabled: control?.enabled,
          disabled: control?.disabled,
          errors: control?.errors
        });
        
        // If it's a FormGroup (checkbox group), check nested controls
        if (control instanceof FormGroup) {
          Object.keys(control.controls).forEach(nestedName => {
            const nestedControl = control.get(nestedName);
            console.log(`  Nested "${controlName}.${nestedName}":`, {
              value: nestedControl?.value,
              valid: nestedControl?.valid,
              enabled: nestedControl?.enabled
            });
          });
        }
      });
    }
    console.log('=== END DEBUG ===');
  }

  // Drag and drop event handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.processSelectedFile(file);
    }
  }

  // Extract file validation logic into a separate method
  private processSelectedFile(file: File): void {
    // Validate file type immediately
    if (file.type !== 'application/pdf') {
      this.selectedFile = null;
      this.uploadMessage = 'Please select a valid PDF file.';
      return;
    }
    
    // Validate file size immediately
    const maxSizeInMB = 10;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      this.selectedFile = null;
      this.uploadMessage = `File size must be less than ${maxSizeInMB}MB. Selected file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`;
      return;
    }
    
    // File is valid
    this.selectedFile = file;
    this.uploadMessage = ''; // Clear any previous messages
    this.error = ''; // Clear any previous errors
    
    console.log('Valid PDF file selected:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  }

  // Helper method to detect signature fields
  isSignatureField(field: any): boolean {
    return field.type === 'signature';
  }

  // Method to get field configuration for a specific field
  getFieldConfiguration(fieldName: string): string[] {
    return this.fieldConfigurations[fieldName] || [];
  }

  // Method to update field configuration
  updateFieldConfiguration(fieldName: string, selectedOptions: string[]): void {
    this.fieldConfigurations[fieldName] = [...selectedOptions];
    console.log(`Updated configuration for ${fieldName}:`, selectedOptions);
    
    // Apply validation if mandatory is selected
    if (selectedOptions.includes('mandatory')) {
      this.setFieldAsRequired(fieldName);
    } else {
      this.removeFieldRequirement(fieldName);
    }
  }

  // Method to set a field as required
  private setFieldAsRequired(fieldName: string): void {
    const sanitizedFieldName = this.sanitizeFieldName(fieldName);
    const control = this.dynamicForm.get(sanitizedFieldName);
    if (control) {
      control.setValidators([Validators.required]);
      control.updateValueAndValidity();
    }
  }

  // Method to remove required validation from a field
  private removeFieldRequirement(fieldName: string): void {
    const sanitizedFieldName = this.sanitizeFieldName(fieldName);
    const control = this.dynamicForm.get(sanitizedFieldName);
    if (control) {
      control.clearValidators();
      control.updateValueAndValidity();
    }
  }

  // Method to initialize field configurations when form is built
  private initializeFieldConfigurations(): void {
    this.fieldConfigurations = {};
    this.fields.forEach(field => {
      this.fieldConfigurations[field.name] = [];
    });
  }

  // Side menu methods
  toggleSideMenu(): void {
    this.isSideMenuCollapsed = !this.isSideMenuCollapsed;
  }

  onFormSelectedFromMenu(form: GeneratedForm): void {
    this.selectedFormFromMenu = form;
    this.viewerFormId = form._id;
    this.currentView = 'viewer';
    
    // Optionally, you could load the form data into the current form editor
    // this.loadFormIntoEditor(form);
  }

  private loadFormIntoEditor(form: GeneratedForm): void {
    // Load the selected form's data into the current form editor
    this.fields = form.formData || [];
    this.formTitle = form.metadata.formName;
    this.originalFieldNameMap = {};
    
    // Rebuild the dynamic form
    this.buildForm();
    this.initializeFieldConfigurations();
    
    // Switch to form view
    this.currentView = 'form';
  }
}
