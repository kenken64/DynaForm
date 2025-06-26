import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NdiService } from '../services/ndi.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-bhutan-ndi',
  templateUrl: './bhutan-ndi.component.html',
  styleUrl: './bhutan-ndi.component.css'
})
export class BhutanNdiComponent implements OnInit, OnDestroy {
  isLoading = false;
  errorMessage = '';
  qrCodeUrl = '';
  threadId = '';
  isListening = false;
  returnUrl = '';
  
  private sseSubscription?: Subscription;

  constructor(
    private ndiService: NdiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get return url from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    // Automatically create proof request when component loads
    this.createProofRequest();
  }

  ngOnDestroy(): void {
    this.stopSSEListening();
  }

  async createProofRequest(): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      console.log('Creating NDI proof request...');
      
      const response = await this.ndiService.createProofRequest().toPromise();
      
      if (response && response.success && response.url) {
        console.log('NDI proof request created:', response);
        
        // Generate QR code for the proof request URL
        this.qrCodeUrl = this.ndiService.generateQRCodeUrl(response.url);
        this.threadId = response.threadId;
        
        console.log('QR Code URL:', this.qrCodeUrl);
        
        // Start listening for SSE notifications
        this.startSSEListening();
      } else {
        throw new Error('Invalid response from NDI service');
      }
    } catch (error: any) {
      console.error('NDI proof request error:', error);
      this.errorMessage = 'Failed to create NDI verification request. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  private startSSEListening(): void {
    if (this.isListening) return;
    
    this.isListening = true;
    console.log('Starting SSE connection for NDI verification...');

    this.sseSubscription = this.ndiService.createSSEConnection(this.threadId).subscribe({
      next: (event) => {
        console.log('SSE Event received:', event);
        
        if (event.type === 'ndi-verification') {
          console.log('NDI verification completed via SSE:', event.data);
          this.onVerificationSuccess(event.data);
        } else if (event.type === 'connected') {
          console.log('SSE connection established');
        } else if (event.type === 'heartbeat') {
          // Heartbeat received, connection is alive
        }
      },
      error: (error) => {
        console.error('SSE connection error:', error);
        this.errorMessage = 'Connection lost. Please try again.';
        this.isListening = false;
      }
    });
  }

  private stopSSEListening(): void {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = undefined;
    }
    this.isListening = false;
    console.log('SSE connection stopped');
  }

  private onVerificationSuccess(proof: any): void {
    // Handle successful verification
    console.log('NDI verification successful:', proof);
    
    // Stop SSE listening since verification is complete
    this.stopSSEListening();
    
    // Check if this is a ProofValidated result (indicating successful verification)
    const isValidated = proof?.data?.verification_result === 'ProofValidated' || 
                       proof?.data?.type === 'present-proof/presentation-result';
    
    if (isValidated) {
      console.log('✅ NDI ProofValidated - Processing user data');
      
      // Extract user data from the requested_presentation
      const userData = this.extractUserDataFromProof(proof);
      
      if (userData.idNumber && userData.fullName) {
        console.log('📝 User data extracted, navigating to registration');
        
        // Navigate to registration form with pre-filled data
        this.router.navigate(['/ndi-register'], { 
          state: { 
            ndiData: proof,
            userData: userData
          },
          queryParams: { returnUrl: this.returnUrl }
        });
      } else {
        console.log('⚠️ Incomplete user data, proceeding to manual registration');
        
        // Navigate to registration form with verification data
        this.router.navigate(['/ndi-register'], { 
          state: { ndiData: proof },
          queryParams: { returnUrl: this.returnUrl }
        });
      }
    } else {
      // For other verification types, go to registration form
      console.log('📝 NDI verification requires registration');
      
      // Navigate to NDI registration form with verification data
      this.router.navigate(['/ndi-register'], { 
        state: { ndiData: proof },
        queryParams: { returnUrl: this.returnUrl }
      });
    }
  }

  private extractUserDataFromProof(proof: any): {idNumber: string, fullName: string, email: string} {
    let idNumber = '';
    let fullName = '';
    let email = '';

    try {
      // Try to extract from requested_presentation
      const presentation = proof?.data?.requested_presentation;
      
      if (presentation?.revealed_attrs) {
        // Look for ID Number and Full Name in revealed attributes
        Object.values(presentation.revealed_attrs).forEach((attr: any) => {
          if (attr?.raw) {
            // Check if this looks like an ID number (numeric)
            if (/^\d+$/.test(attr.raw) && attr.raw.length >= 10) {
              idNumber = attr.raw;
            }
            // Check if this looks like a name (contains letters and spaces)
            else if (/^[a-zA-Z\s]+$/.test(attr.raw) && attr.raw.length > 2) {
              fullName = attr.raw;
            }
          }
        });
      }

      console.log('Extracted user data:', { idNumber, fullName, email });
    } catch (error) {
      console.error('Error extracting user data from proof:', error);
    }

    return { idNumber, fullName, email };
  }

  // Retry verification
  retry(): void {
    this.stopSSEListening();
    this.qrCodeUrl = '';
    this.threadId = '';
    this.errorMessage = '';
    this.createProofRequest();
  }

  // Cancel and go back to login
  cancel(): void {
    this.stopSSEListening();
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: this.returnUrl } 
    });
  }

  // Navigate to home
  goToHome(): void {
    this.stopSSEListening();
    this.router.navigate(['/']);
  }

  // Handle QR code image loading error
  onQRError(): void {
    console.error('QR Code loading failed for URL:', this.qrCodeUrl);
    console.error('This could be due to CSP restrictions or network issues');
    this.errorMessage = 'Failed to load QR code. Please try again or check your network connection.';
  }
}
