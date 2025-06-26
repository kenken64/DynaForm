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
    
    // You can extract user information from the proof here
    // For example: proof.data.credentials or proof.data.attributes
    
    // Show success message
    alert('NDI verification successful! Please complete your registration.');
    
    // Navigate to NDI registration form with verification data
    this.router.navigate(['/ndi-register'], { 
      state: { ndiData: proof }
    });
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
    this.errorMessage = 'Failed to load QR code. Please try again.';
  }
}
