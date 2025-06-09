import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BlockchainService, BlockchainVerificationResult } from '../services/blockchain.service';
import { FormVerificationService, FormVerificationResult } from '../services/form-verification.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  searchQuery: string = '';
  isVerifying: boolean = false;
  verificationResult: FormVerificationResult | null = null;
  showFireworks: boolean = false;
  isVerified: boolean = false;

  constructor(
    private router: Router,
    private blockchainService: BlockchainService,
    private formVerificationService: FormVerificationService
  ) {}

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  verifyBlockchain() {
    if (!this.searchQuery.trim()) {
      return;
    }

    const input = this.searchQuery.trim();
    console.log('Input:', input);
    console.log('Is HTTP URL:', this.formVerificationService.isHttpUrl(input));
    
    // Check if input is an HTTP URL and validate it
    if (this.formVerificationService.isHttpUrl(input)) {
      // For HTTP URLs, ensure they match our expected format
      const formId = this.formVerificationService.extractFormIdFromUrl(input);
      console.log('Extracted Form ID from HTTP URL:', formId);
      
      if (!formId) {
        this.verificationResult = {
          success: false,
          verified: false,
          message: 'Invalid DynaForm URL format. Expected format: http://localhost:4200/public/form/{formId}/{fingerprint}',
          error: 'Invalid URL format'
        };
        return;
      }
    } else {
      // For non-HTTP inputs, try to extract form ID
      const formId = this.formVerificationService.extractFormIdFromUrl(input);
      console.log('Extracted Form ID from non-HTTP input:', formId);
      
      if (!formId) {
        this.verificationResult = {
          success: false,
          verified: false,
          message: 'Invalid input. Please enter a valid form URL or form ID.',
          error: 'Invalid format'
        };
        return;
      }
    }

    // Extract form ID from the input (could be URL or direct ID)
    const formId = this.formVerificationService.extractFormIdFromUrl(input);
    console.log('Final extracted Form ID:', formId);
    
    if (!formId) {
      this.verificationResult = {
        success: false,
        verified: false,
        message: 'Could not extract form ID from input. Please check the format.',
        error: 'Invalid format'
      };
      return;
    }

    // Validate form ID format
    if (!this.formVerificationService.isValidFormId(formId)) {
      this.verificationResult = {
        success: false,
        verified: false,
        message: 'Invalid form ID format. Must be a 24-character hexadecimal string.',
        error: 'Invalid format'
      };
      return;
    }

    this.isVerifying = true;
    this.verificationResult = null;
    this.isVerified = false;

    this.formVerificationService.verifyFormStatus(formId).subscribe({
      next: (result) => {
        this.verificationResult = result;
        this.isVerifying = false;
        
        if (result.success && result.verified) {
          this.isVerified = true;
          this.showFireworks = true;
          
          // Hide fireworks after longer animation (6 seconds)
          setTimeout(() => {
            this.showFireworks = false;
          }, 6000);
        }
      },
      error: (error) => {
        console.error('Verification error:', error);
        this.verificationResult = {
          success: false,
          verified: false,
          message: 'Verification failed. Please try again later.',
          error: error.message || 'Network error'
        };
        this.isVerifying = false;
        this.isVerified = false;
      }
    });
  }

  resetVerification() {
    this.searchQuery = '';
    this.verificationResult = null;
    this.isVerified = false;
    this.showFireworks = false;
    this.isVerifying = false;
  }

  onSearchKeyup(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.verifyBlockchain();
    }
  }

  generateSampleHash() {
    // Use the sample form ID for testing (24 characters for valid MongoDB ObjectId)
    this.searchQuery = 'http://localhost:4200/public/form/6845ca285a88a8c1282af178/9fda53adc47ad259e739faff83b0d69c8ec9ea9a1437b935328df5be75ee5bdf';
  }

  /**
   * Debug method to test URL extraction
   */
  testUrlExtraction() {
    const testUrl = 'http://localhost:4200/public/form/6845ca285a88a8c1282af178/9fda53adc47ad259e739faff83b0d69c8ec9ea9a1437b935328df5be75ee5bdf';
    const extractedId = this.formVerificationService.extractFormIdFromUrl(testUrl);
    console.log('Test URL:', testUrl);
    console.log('Extracted Form ID:', extractedId);
    console.log('Is HTTP URL:', this.formVerificationService.isHttpUrl(testUrl));
    console.log('Is Valid Form ID:', extractedId ? this.formVerificationService.isValidFormId(extractedId) : false);
  }
}
