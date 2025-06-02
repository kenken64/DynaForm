import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

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
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
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

  register(name: string, email: string, username: string, password: string): Observable<boolean> {
    const registerData: RegisterRequest = { name, email, username, password };
    
    // For demo purposes, simulate registration
    return new Observable(observer => {
      setTimeout(() => {
        // Simple validation
        if (name && email && username && password) {
          // Simulate successful registration
          observer.next(true);
          observer.complete();
        } else {
          observer.error(new Error('All fields are required'));
        }
      }, 1000);
    });

    // Uncomment this for real API integration:
    /*
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, registerData)
      .pipe(
        map(response => {
          if (response.success) {
            // Don't auto-login after registration, require email verification
            return true;
          }
          return false;
        }),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => new Error(error.error?.message || 'Registration failed'));
        })
      );
    */
  }

  login(username: string, password: string): Observable<boolean> {
    // For demo purposes, keep the existing demo login
    if (username === 'admin' && password === 'password') {
      return this.loginDemo(username, password);
    }

    // For real API integration:
    /*
    const loginData: LoginRequest = { username, password };
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, loginData)
      .pipe(
        map(response => {
          if (response.success && response.user && response.accessToken) {
            this.setAuthData(response.user, response.accessToken, response.refreshToken);
            return true;
          }
          return false;
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => new Error(error.error?.message || 'Login failed'));
        })
      );
    */

    // Demo fallback
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(false);
        observer.complete();
      }, 1000);
    });
  }

  // Passkey Authentication Methods
  async registerPasskey(): Promise<boolean> {
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn is not supported in this browser');
      }

      // For demo purposes, simulate passkey registration
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 2000);
      });

      // Uncomment for real implementation:
      /*
      // Get registration options from server
      const optionsResponse = await this.http.post<any>(`${this.apiUrl}/auth/passkey/register/begin`, {}).toPromise();
      
      if (!optionsResponse.success) {
        throw new Error(optionsResponse.message || 'Failed to get registration options');
      }

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: optionsResponse.options
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      // Send credential to server for verification
      const verificationResponse = await this.http.post<AuthResponse>(`${this.apiUrl}/auth/passkey/register/finish`, {
        credential: this.encodeCredential(credential),
        friendlyName: this.getDeviceName()
      }).toPromise();

      return verificationResponse?.success || false;
      */
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

      // For demo purposes, simulate passkey authentication
      const user: User = {
        id: '1',
        username: 'admin',
        email: 'admin@dynaform.com',
        name: 'Admin User',
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: new Date()
      };

      this.setAuthData(user, 'demo-passkey-token');
      return true;

      // Uncomment for real implementation:
      /*
      // Get authentication options from server
      const optionsResponse = await this.http.post<any>(`${this.apiUrl}/auth/passkey/authenticate/begin`, {}).toPromise();
      
      if (!optionsResponse.success) {
        throw new Error(optionsResponse.message || 'Failed to get authentication options');
      }

      // Get credential
      const credential = await navigator.credentials.get({
        publicKey: optionsResponse.options
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Authentication cancelled or failed');
      }

      // Send credential to server for verification
      const verificationResponse = await this.http.post<AuthResponse>(`${this.apiUrl}/auth/passkey/authenticate/finish`, {
        credential: this.encodeCredential(credential)
      }).toPromise();

      if (verificationResponse?.success && verificationResponse.user && verificationResponse.accessToken) {
        this.setAuthData(verificationResponse.user, verificationResponse.accessToken, verificationResponse.refreshToken);
        return true;
      }

      return false;
      */
    } catch (error) {
      console.error('Passkey authentication error:', error);
      throw error;
    }
  }

  async getPasskeys(): Promise<PasskeyCredential[]> {
    try {
      // Demo data
      return [
        {
          credentialId: 'demo-credential-1',
          friendlyName: 'iPhone Touch ID',
          createdAt: new Date('2024-01-15'),
          lastUsed: new Date('2024-01-20'),
          deviceType: 'platform'
        },
        {
          credentialId: 'demo-credential-2',
          friendlyName: 'YubiKey 5',
          createdAt: new Date('2024-01-10'),
          lastUsed: new Date('2024-01-18'),
          deviceType: 'cross-platform'
        }
      ];

      // Uncomment for real implementation:
      /*
      const response = await this.http.get<{success: boolean, passkeys: PasskeyCredential[]}>(`${this.apiUrl}/auth/passkeys`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      return response?.passkeys || [];
      */
    } catch (error) {
      console.error('Error fetching passkeys:', error);
      return [];
    }
  }

  async deletePasskey(credentialId: string): Promise<boolean> {
    try {
      // Demo implementation
      return true;

      // Uncomment for real implementation:
      /*
      const response = await this.http.delete<{success: boolean}>(`${this.apiUrl}/auth/passkeys/${credentialId}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      return response?.success || false;
      */
    } catch (error) {
      console.error('Error deleting passkey:', error);
      return false;
    }
  }

  private encodeCredential(credential: PublicKeyCredential): any {
    const response = credential.response as AuthenticatorAssertionResponse | AuthenticatorAttestationResponse;
    
    const encodedCredential: any = {
      id: credential.id,
      rawId: this.arrayBufferToBase64(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: this.arrayBufferToBase64(response.clientDataJSON)
      }
    };

    if (response instanceof AuthenticatorAttestationResponse) {
      encodedCredential.response.attestationObject = this.arrayBufferToBase64(response.attestationObject);
    } else if (response instanceof AuthenticatorAssertionResponse) {
      encodedCredential.response.authenticatorData = this.arrayBufferToBase64(response.authenticatorData);
      encodedCredential.response.signature = this.arrayBufferToBase64(response.signature);
      if (response.userHandle) {
        encodedCredential.response.userHandle = this.arrayBufferToBase64(response.userHandle);
      }
    }

    return encodedCredential;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
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

    // Uncomment for real implementation:
    /*
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
    */
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

  private getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  logout(): void {
    const refreshToken = localStorage.getItem('refresh_token');
    
    // Notify server about logout (uncomment for real implementation)
    /*
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/auth/logout`, { refreshToken }, {
        headers: this.getAuthHeaders()
      }).subscribe();
    }
    */

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

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Backward compatibility method for demo mode
  private loginDemo(username: string, password: string): Observable<boolean> {
    return new Observable(observer => {
      setTimeout(() => {
        if (username === 'admin' && password === 'password') {
          const user: User = {
            id: '1',
            username: username,
            email: 'admin@dynaform.com',
            name: 'Admin User',
            role: 'admin',
            isActive: true,
            isEmailVerified: true,
            lastLoginAt: new Date()
          };

          // Store auth token and user data
          localStorage.setItem('access_token', 'demo-jwt-token');
          localStorage.setItem('user_data', JSON.stringify(user));

          this.isAuthenticatedSubject.next(true);
          this.currentUserSubject.next(user);

          observer.next(true);
          observer.complete();
        } else {
          observer.next(false);
          observer.complete();
        }
      }, 1000); // Simulate network delay
    });
  }
}
