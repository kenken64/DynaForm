import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
}

export interface RegisterRequest {
  name: string;
  email: string;
  username: string;
}

// LoginRequest interface removed - using passkey-only authentication

export interface AuthResponse {
  success: boolean;
  user?: User;
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

export interface PasskeyCredential {
  credentialId: string;
  friendlyName: string;
  createdAt: Date;
  lastUsed?: Date;
  deviceType: 'platform' | 'cross-platform';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private currentRegistrationUserId: string | null = null;
  private apiUrl = 'http://localhost:3000/api'; // Backend API URL

  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    // Check if user is already logged in on service initialization
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    const token = this.getAccessToken();
    const userData = localStorage.getItem('user_data');
    
    if (token && userData && !this.isTokenExpired(token)) {
      try {
        const user = JSON.parse(userData);
        this.isAuthenticatedSubject.next(true);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.logout();
      }
    } else {
      // Try to refresh token if available
      this.tryRefreshToken();
    }
  }

  register(name: string, email: string, username: string): Observable<boolean> {
    const registerData = { fullName: name, email, username };
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, registerData)
      .pipe(
        map(response => {
          if (response.success && response.userId) {
            this.currentRegistrationUserId = response.userId;
            return true;
          }
          return false;
        }),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => new Error(error.error?.message || 'Registration failed'));
        })
      );
  }

  // Passkey-only authentication - no password login supported
  // Use authenticateWithPasskey() method instead
  login(): Observable<boolean> {
    return new Observable(observer => {
      observer.error(new Error('Password-based login is not supported. Please use passkey authentication.'));
    });
  }

  // Passkey Authentication Methods
  async registerPasskey(): Promise<boolean> {
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn is not supported in this browser');
      }

      // Check if we have a userId from registration
      if (!this.currentRegistrationUserId) {
        throw new Error('No user ID available. Please register first.');
      }

      // Get registration options from server
      const optionsResponse = await this.http.post<any>(`${this.apiUrl}/auth/passkey/register/begin`, {
        userId: this.currentRegistrationUserId
      }).toPromise();
      
      if (!optionsResponse.success) {
        throw new Error(optionsResponse.message || 'Failed to get registration options');
      }

      // Create credential using SimpleWebAuthn
      const attResp = await startRegistration(optionsResponse.options);

      // Send credential to server for verification
      const verificationResponse = await this.http.post<AuthResponse>(`${this.apiUrl}/auth/passkey/register/finish`, {
        userId: this.currentRegistrationUserId,
        credential: attResp,
        friendlyName: this.getDeviceName()
      }).toPromise();

      if (verificationResponse?.success) {
        // Clear the registration userId since registration is complete
        this.currentRegistrationUserId = null;
      }

      return verificationResponse?.success || false;
    } catch (error) {
      console.error('Passkey registration error:', error);
      throw error;
    }
  }

  async authenticateWithPasskey(): Promise<boolean> {
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn is not supported in this browser');
      }

      // Get authentication options from server
      const optionsResponse = await this.http.post<any>(`${this.apiUrl}/auth/passkey/authenticate/begin`, {}).toPromise();
      
      if (!optionsResponse.success) {
        throw new Error(optionsResponse.message || 'Failed to get authentication options');
      }

      // Get credential using SimpleWebAuthn
      const asseResp = await startAuthentication(optionsResponse.options);

      // Send credential to server for verification
      const verificationResponse = await this.http.post<AuthResponse>(`${this.apiUrl}/auth/passkey/authenticate/finish`, {
        credential: asseResp
      }).toPromise();

      if (verificationResponse?.success && verificationResponse.user && verificationResponse.accessToken) {
        this.setAuthData(verificationResponse.user, verificationResponse.accessToken, verificationResponse.refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Passkey authentication error:', error);
      throw error;
    }
  }

  async getPasskeys(): Promise<PasskeyCredential[]> {
    try {
      const response = await this.http.get<{success: boolean, passkeys: PasskeyCredential[]}>(`${this.apiUrl}/auth/passkeys`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      return response?.passkeys || [];
    } catch (error) {
      console.error('Error fetching passkeys:', error);
      return [];
    }
  }

  async deletePasskey(credentialId: string): Promise<boolean> {
    try {
      const response = await this.http.delete<{success: boolean}>(`${this.apiUrl}/auth/passkeys/${credentialId}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      return response?.success || false;
    } catch (error) {
      console.error('Error deleting passkey:', error);
      return false;
    }
  }

  private getDeviceName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Android')) return 'Android Device';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Linux')) return 'Linux PC';
    return 'Unknown Device';
  }

  private setAuthData(user: User, accessToken: string, refreshToken?: string): void {
    // Store tokens
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    
    // Store user data
    localStorage.setItem('user_data', JSON.stringify(user));

    // Update subjects
    this.isAuthenticatedSubject.next(true);
    this.currentUserSubject.next(user);
  }

  private tryRefreshToken(): void {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return;
    }

    this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken })
      .subscribe({
        next: (response) => {
          if (response.success && response.user && response.accessToken) {
            this.setAuthData(response.user, response.accessToken, response.refreshToken);
          } else {
            this.logout();
          }
        },
        error: () => {
          this.logout();
        }
      });
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch (error) {
      return true;
    }
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  public getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  logout(): void {
    const refreshToken = localStorage.getItem('refresh_token');
    
    // Notify server about logout
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/auth/logout`, { refreshToken }, {
        headers: this.getAuthHeaders()
      }).subscribe();
    }

    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('auth_token'); // Legacy token
    
    // Update subjects
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    
    // Navigate to login
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // getCurrentUser method - returns current authenticated user
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
