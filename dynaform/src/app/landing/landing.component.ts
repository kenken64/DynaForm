import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BlockchainService, BlockchainVerificationResult } from '../services/blockchain.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  searchQuery: string = '';
  isVerifying: boolean = false;
  verificationResult: BlockchainVerificationResult | null = null;

  constructor(
    private router: Router,
    private blockchainService: BlockchainService
  ) {}

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  verifyBlockchain() {
    if (!this.searchQuery.trim()) {
      return;
    }

    // Basic format validation
    if (!this.blockchainService.isValidHashFormat(this.searchQuery)) {
      this.verificationResult = {
        isValid: false,
        message: 'Invalid hash format. Please enter a valid hexadecimal hash.'
      };
      return;
    }

    this.isVerifying = true;
    this.verificationResult = null;

    this.blockchainService.verifyFormHash(this.searchQuery.trim()).subscribe({
      next: (result) => {
        this.verificationResult = result;
        this.isVerifying = false;
      },
      error: (error) => {
        console.error('Verification error:', error);
        this.verificationResult = {
          isValid: false,
          message: 'Verification failed. Please try again later.'
        };
        this.isVerifying = false;
      }
    });
  }

  onSearchKeyup(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.verifyBlockchain();
    }
  }

  generateSampleHash() {
    this.searchQuery = this.blockchainService.generateMockHash();
  }
}
