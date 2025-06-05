import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

export interface BlockchainVerificationResult {
  isValid: boolean;
  message: string;
  hash?: string;
  timestamp?: string;
  blockNumber?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BlockchainService {
  private apiUrl = '/api/blockchain'; // This would be your actual blockchain API endpoint

  constructor(private http: HttpClient) {}

  /**
   * Verify a form hash on the blockchain
   */
  verifyFormHash(hash: string): Observable<BlockchainVerificationResult> {
    // For now, simulate blockchain verification
    // In production, this would call your actual blockchain API
    return this.simulateBlockchainVerification(hash);
  }

  /**
   * Submit a form hash to the blockchain
   */
  submitFormHash(formData: any): Observable<{ hash: string; transactionId: string }> {
    // This would submit form data to blockchain and return the hash
    return this.http.post<{ hash: string; transactionId: string }>(`${this.apiUrl}/submit`, formData);
  }

  /**
   * Simulate blockchain verification for demo purposes
   */
  private simulateBlockchainVerification(hash: string): Observable<BlockchainVerificationResult> {
    return of(null).pipe(
      delay(2000), // Simulate network delay
      map(() => {
        // Mock validation logic
        const isValidLength = hash.length >= 10;
        const isValidFormat = /^[a-fA-F0-9]+$/.test(hash) || hash.startsWith('0x');
        const isValid = isValidLength && isValidFormat;

        if (isValid) {
          return {
            isValid: true,
            message: 'Form verified successfully on blockchain!',
            hash: hash,
            timestamp: new Date().toISOString(),
            blockNumber: Math.floor(Math.random() * 1000000) + 500000
          };
        } else {
          return {
            isValid: false,
            message: 'Form not found or invalid hash format. Please check your hash and try again.',
          };
        }
      })
    );
  }

  /**
   * Generate a mock hash for demonstration
   */
  generateMockHash(): string {
    const chars = '0123456789abcdef';
    let result = '0x';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Check if a hash format is valid
   */
  isValidHashFormat(hash: string): boolean {
    // Basic validation for hash format
    if (!hash) return false;
    
    // Remove 0x prefix if present
    const cleanHash = hash.startsWith('0x') ? hash.slice(2) : hash;
    
    // Check if it's hexadecimal and reasonable length
    return /^[a-fA-F0-9]+$/.test(cleanHash) && cleanHash.length >= 8;
  }
}
