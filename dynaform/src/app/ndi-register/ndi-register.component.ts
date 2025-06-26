import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NdiService } from '../services/ndi.service';

@Component({
  selector: 'app-ndi-register',
  templateUrl: './ndi-register.component.html',
  styleUrl: './ndi-register.component.css'
})
export class NdiRegisterComponent implements OnInit {
  fullName = '';
  email = '';
  username = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  ndiData: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private ndiService: NdiService
  ) {}

  ngOnInit(): void {
    // Get NDI verification data from navigation state
    const navigation = this.router.getCurrentNavigation();
    this.ndiData = navigation?.extras?.state?.['ndiData'];
    const userData = navigation?.extras?.state?.['userData'];
    
    // if (!this.ndiData) {
    //   // If no NDI data, redirect back to login
    //   console.error('No NDI verification data found');
    //   this.router.navigate(['/login']);
    //   return;
    // }

    // Allow registration even without NDI data (for manual testing/fallback)
    if (!this.ndiData) {
      console.warn('No NDI verification data found - allowing manual registration');
    }

    console.log('NDI verification data:', this.ndiData);
    console.log('Pre-extracted user data:', userData);
    
    // Pre-fill data if available from navigation state
    if (userData) {
      this.fullName = userData.fullName || '';
      // Generate username from full name if not provided
      if (!userData.username && userData.fullName) {
        this.username = this.generateUsernameFromName(userData.fullName);
      }
      
      // If we have all required data, auto-submit
      if (this.fullName && this.username) {
        console.log('✅ All required data available, auto-submitting registration');
        // Set a placeholder email if not provided
        if (!this.email) {
          this.email = `${this.username}@ndi.bt`;
        }
        
        // Auto-submit after a brief delay to show the form
        setTimeout(() => {
          this.onSubmit();
        }, 1000);
      }
    } else {
      // Fallback: Try to extract name from NDI proof using old method
      this.extractNameFromNDI();
    }
  }

  private generateUsernameFromName(fullName: string): string {
    // Generate a username from full name
    return fullName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .split(' ')
      .filter(part => part.length > 0)
      .join('_')
      .substring(0, 20); // Limit to 20 characters
  }

  private extractNameFromNDI(): void {
    try {
      // Try to extract name from various possible NDI response formats
      
      // Format 1: New NDI format with requested_presentation
      if (this.ndiData?.data?.requested_presentation?.revealed_attrs) {
        const revealedAttrs = this.ndiData.data.requested_presentation.revealed_attrs;
        Object.values(revealedAttrs).forEach((attr: any) => {
          if (attr?.raw && /^[a-zA-Z\s]+$/.test(attr.raw) && attr.raw.length > 2) {
            this.fullName = attr.raw;
          }
        });
      }
      // Format 2: credentials array  
      else if (this.ndiData?.data?.credentials) {
        const nameCredential = this.ndiData.data.credentials.find((cred: any) => 
          cred.attributes?.['Full Name'] || cred.attributes?.['full_name'] || cred.attributes?.['name']
        );
        if (nameCredential) {
          this.fullName = nameCredential.attributes['Full Name'] || 
                          nameCredential.attributes['full_name'] || 
                          nameCredential.attributes['name'] || '';
        }
      } 
      // Format 3: direct attributes
      else if (this.ndiData?.data?.attributes) {
        this.fullName = this.ndiData.data.attributes['Full Name'] || 
                        this.ndiData.data.attributes['full_name'] || 
                        this.ndiData.data.attributes['name'] || '';
      } 
      // Format 4: Hyperledger Indy format
      else if (this.ndiData?.proof?.requested_proof?.revealed_attrs) {
        const nameAttr = Object.values(this.ndiData.proof.requested_proof.revealed_attrs).find((attr: any) => 
          attr?.['Full Name'] || attr?.['full_name'] || attr?.['name']
        ) as any;
        if (nameAttr) {
          this.fullName = nameAttr['Full Name'] || nameAttr['full_name'] || nameAttr['name'] || '';
        }
      }

      // Generate username if we have a name
      if (this.fullName && !this.username) {
        this.username = this.generateUsernameFromName(this.fullName);
      }

      console.log('Extracted name from NDI:', this.fullName);
    } catch (error) {
      console.error('Error extracting name from NDI data:', error);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.isLoading) return;

    // Validate form
    if (!this.fullName.trim() || !this.email.trim() || !this.username.trim()) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email.trim())) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    // Basic username validation
    const usernameRegex = /^[a-zA-Z0-9_\-]{3,20}$/;
    if (!usernameRegex.test(this.username.trim())) {
      this.errorMessage = 'Username must be 3-20 characters long and contain only letters, numbers, hyphens, and underscores.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      console.log('Registering NDI user with data:', {
        fullName: this.fullName.trim(),
        email: this.email.trim(),
        username: this.username.trim(),
        ndiData: this.ndiData || 'No NDI data available'
      });

      // Call the new NDI registration endpoint
      // If ndiData is undefined, create a placeholder structure
      const ndiVerificationData = this.ndiData || {
        type: 'manual-registration',
        verification_result: 'ManualEntry',
        timestamp: new Date().toISOString(),
        data: {
          source: 'manual-entry',
          verified: false
        }
      };

      const response = await this.ndiService.registerNdiUser({
        fullName: this.fullName.trim(),
        email: this.email.trim(),
        username: this.username.trim(),
        ndiVerificationData: ndiVerificationData
      }).toPromise();

      if (response?.success && response.user && response.accessToken) {
        // Set authentication data in AuthService
        this.authService.setUserAuthData(response.user, response.accessToken, response.refreshToken);
        
        this.successMessage = 'Registration successful! Redirecting to dashboard...';
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      } else {
        throw new Error(response?.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('NDI user registration error:', error);
      
      if (error?.status === 409) {
        this.errorMessage = 'Username or email already exists. Please choose different ones.';
      } else if (error?.status === 400) {
        this.errorMessage = error?.error?.message || 'Invalid registration data. Please check your inputs.';
      } else {
        this.errorMessage = error?.error?.message || error?.message || 'Registration failed. Please try again.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  cancel(): void {
    this.router.navigate(['/login']);
  }

  // Helper method to get formatted NDI verification info for display
  getNdiVerificationInfo(): string {
    if (!this.ndiData) return 'Unknown';
    
    try {
      // Try different formats to show verification source
      if (this.ndiData?.data?.schema_name) {
        return 'Bhutan National Digital Identity';
      } else if (this.ndiData?.proof?.identifiers) {
        return 'Bhutan NDI Credential';
      } else {
        return 'Digital Identity Verified';
      }
    } catch (error) {
      return 'Digital Identity Verified';
    }
  }
}
