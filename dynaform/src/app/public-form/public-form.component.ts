import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { GeneratedForm, FieldConfiguration, FieldConfigurationValue } from '../interfaces/form.interface';
import { NdiService } from '../services/ndi.service';

@Component({
  selector: 'app-public-form',
  templateUrl: './public-form.component.html',
  styleUrls: ['./public-form.component.css']
})
export class PublicFormComponent implements OnInit, OnDestroy {
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
  
  // NDI Verification properties
  isNdiVerificationRequired = true;
  isNdiVerified = false;
  isNdiLoading = false;
  isWaitingForSSEVerification = false; // New property to track SSE waiting state
  ndiError = '';
  qrCodeUrl = '';
  threadId = '';
  isListening = false;
  ndiData: any = null;
  
  // Blockchain Verification properties
  isBlockchainVerified = false;
  blockchainData: any = null;
  
  private sseSubscription?: Subscription;
  
  // Utility
  objectKeys = Object.keys;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private ndiService: NdiService
  ) {
    // Initialize empty form to prevent template errors
    this.dynamicForm = this.fb.group({});
  }

  ngOnInit(): void {
    // Get parameters from route
    this.formId = this.route.snapshot.paramMap.get('formId') || '';
    this.jsonFingerprint = this.route.snapshot.paramMap.get('fingerprint') || '';
    
    if (this.formId && this.jsonFingerprint) {
      // Start with NDI verification instead of loading form directly
      this.startNdiVerification();
    } else {
      this.error = 'Invalid form parameters. Both form ID and JSON fingerprint are required.';
    }
  }

  ngOnDestroy(): void {
    this.stopSSEListening();
  }

  // NDI Verification Methods
  async startNdiVerification(): Promise<void> {
    if (this.isNdiLoading) return;

    this.isNdiLoading = true;
    this.ndiError = '';

    try {
      console.log('🔒 Starting NDI verification for public form access...');
      
      const response = await this.ndiService.createProofRequest().toPromise();
      
      if (response && response.success && response.url) {
        console.log('✅ NDI proof request created:', response);
        
        // Generate QR code for the proof request URL
        this.qrCodeUrl = this.ndiService.generateQRCodeUrl(response.url);
        this.threadId = response.threadId;
        
        console.log('📱 QR Code URL:', this.qrCodeUrl);
        
        // Start listening for SSE notifications
        this.startSSEListening();
        
        // Set waiting state for SSE verification
        this.isWaitingForSSEVerification = true;
        console.log('⏳ Now waiting for SSE verification event...');
      } else {
        throw new Error('Invalid response from NDI service');
      }
    } catch (error: any) {
      console.error('❌ NDI proof request error:', error);
      this.ndiError = 'Failed to create NDI verification request. Please try again.';
    } finally {
      this.isNdiLoading = false;
    }
  }

  private startSSEListening(): void {
    if (this.isListening) return;
    
    this.isListening = true;
    console.log('🎧 Starting SSE connection for NDI verification...');

    this.sseSubscription = this.ndiService.createSSEConnection(this.threadId).subscribe({
      next: (event) => {
        console.log('📡 SSE Event received:', event);
        
        // Only process NDI verification events
        if (event.type === 'ndi-verification') {
          console.log('🔍 Processing NDI verification event:', event.data);
          this.processNdiVerificationEvent(event.data);
        } else if (event.type === 'connected') {
          console.log('🔗 SSE connection established');
        } else if (event.type === 'heartbeat') {
          console.log('💓 Heartbeat received - connection alive');
        } else {
          console.log('ℹ️ Ignoring non-verification SSE event:', event.type);
        }
      },
      error: (error) => {
        console.error('❌ SSE connection error:', error);
        this.ndiError = 'Connection lost. Please try again.';
        this.isListening = false;
      }
    });
  }

  private processNdiVerificationEvent(eventData: any): void {
    console.log('🔎 Validating NDI verification event data:', eventData);
    
    // Clear waiting state since we received an event
    this.isWaitingForSSEVerification = false;
    
    // Strict validation of SSE event data
    if (!eventData) {
      console.log('❌ No event data received');
      this.ndiError = 'Invalid verification data received. Please try again.';
      return;
    }

    // Check for valid verification result - ONLY ProofValidated is considered positive
    const isProofValidated = eventData?.verification_result === 'ProofValidated';
    
    console.log(`🔍 Verification result: "${eventData?.verification_result}" - Valid: ${isProofValidated}`);

    if (isProofValidated) {
      console.log('✅ Valid NDI verification event (ProofValidated) - proceeding with form access');
      this.onNdiVerificationSuccess({ data: eventData });
    } else {
      console.log('❌ NDI verification failed - Result is not ProofValidated:', eventData?.verification_result);
      this.ndiError = 'NDI verification failed. Please try again.';
    }
  }

  private stopSSEListening(): void {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = undefined;
    }
    this.isListening = false;
    console.log('🔇 SSE connection stopped');
  }

  private onNdiVerificationSuccess(proof: any): void {
    console.log('🎉 NDI verification successful for public form:', proof);
    
    // Stop SSE listening since verification is complete
    this.stopSSEListening();
    
    // Clear waiting state
    this.isWaitingForSSEVerification = false;
    
    // Check if this is a valid NDI verification from SSE event - ONLY ProofValidated is valid
    const isValidated = proof?.data?.verification_result === 'ProofValidated';
    
    if (isValidated) {
      console.log('✅ NDI verification validated via SSE (ProofValidated) - Setting verified state and loading form');
      
      // Store NDI data
      this.ndiData = proof;
      
      // Set verified state (this will show the form section)
      this.isNdiVerified = true;
      
      // Load the actual form after SSE verification
      this.loadForm();
    } else {
      console.log('❌ NDI verification failed - Invalid proof from SSE, verification_result is not ProofValidated:', proof?.data?.verification_result);
      this.ndiError = 'NDI verification failed. Please try again.';
      this.isNdiVerified = false; // Ensure we stay in verification mode
    }
  }

  // NDI retry method
  retryNdiVerification(): void {
    this.stopSSEListening();
    this.qrCodeUrl = '';
    this.threadId = '';
    this.ndiError = '';
    this.isWaitingForSSEVerification = false; // Clear waiting state
    this.startNdiVerification();
  }

  // Handle QR code image loading error
  onQRError(): void {
    console.error('❌ QR Code loading failed for URL:', this.qrCodeUrl);
    this.ndiError = 'Failed to load QR code. Please try again or check your network connection.';
  }

  loadForm(): void {
    this.loading = true;
    this.error = '';

    // Direct HTTP call instead of service
    this.http.get<GeneratedForm>(`/api/public/forms?formId=${this.formId}&jsonFingerprint=${this.jsonFingerprint}`).subscribe({
      next: (formData: GeneratedForm) => {
        this.loading = false;
        this.formData = formData;
        
        // Extract blockchain verification information
        this.isBlockchainVerified = (formData as any).isBlockchainVerified || false;
        this.blockchainData = (formData as any).blockchainData || null;
        
        // Also check form status and blockchainInfo directly for verification
        if (!this.isBlockchainVerified && (formData as any).status === 'verified' && (formData as any).blockchainInfo) {
          this.isBlockchainVerified = true;
          this.blockchainData = (formData as any).blockchainInfo;
          
          // If no explorerUrl is set, construct it
          if (this.blockchainData && this.blockchainData.transactionHash && !this.blockchainData.explorerUrl) {
            this.blockchainData.explorerUrl = `https://sepolia.etherscan.io/tx/${this.blockchainData.transactionHash}`;
          }
        }
        
        console.log('🔗 Blockchain verification status:', this.isBlockchainVerified);
        console.log('📋 Form status:', (formData as any).status);
        if (this.blockchainData) {
          console.log('💎 Blockchain data:', this.blockchainData);
          console.log('🔗 Explorer URL:', this.blockchainData.explorerUrl);
        }
        
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
      // Skip label fields as they don't need form controls
      if (field.type === 'label') {
        console.log(`Skipping label field: ${field.name} (labels don't need form controls)`);
        return;
      }
      
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
      submittedAt: new Date().toISOString(),
      ndiVerificationData: this.ndiData // Include NDI verification data
    };

    this.http.post<any>('/api/public/forms/submit', formSubmissionData).subscribe({
      next: (response: any) => {
        this.saving = false;
        this.snackBar.open('Form submitted successfully with NDI verification!', 'Close', {
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

  // Helper method to check if form is blockchain verified
  isFormBlockchainVerified(): boolean {
    return this.isBlockchainVerified && !!this.blockchainData?.transactionHash;
  }

  // Get blockchain transaction hash for display
  getBlockchainTransactionHash(): string {
    return this.blockchainData?.transactionHash || '';
  }

  // Get formatted blockchain verification date
  getBlockchainVerificationDate(): string {
    if (this.blockchainData?.verifiedAt) {
      return new Date(this.blockchainData.verifiedAt).toLocaleDateString();
    }
    return '';
  }

  // Blockchain verification method
  openBlockchainExplorer(): void {
    // Check for explorerUrl first, if not available construct from transaction hash
    if (this.blockchainData?.explorerUrl) {
      window.open(this.blockchainData.explorerUrl, '_blank');
    } else if (this.blockchainData?.transactionHash) {
      // Construct Sepolia Etherscan URL from transaction hash
      const sepoliaUrl = `https://sepolia.etherscan.io/tx/${this.blockchainData.transactionHash}`;
      window.open(sepoliaUrl, '_blank');
    } else {
      console.warn('No transaction hash or explorer URL available for blockchain verification');
    }
  }
}
