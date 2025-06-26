import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NDIProofRequest {
  success: boolean;
  url: string;
  threadId: string;
}

export interface NDIProofStatus {
  success: boolean;
  status: any;
}

export interface NDIWebhookResponse {
  proof: any;
}

export interface NDIUserRegistration {
  fullName: string;
  email: string;
  username: string;
  ndiVerificationData: any;
}

export interface NDIRegistrationResponse {
  success: boolean;
  user?: any;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NdiService {
  private readonly apiUrl = '/api';

  constructor(private http: HttpClient) {}

  /**
   * Create a new NDI proof request for identity verification
   * @returns Observable with QR code URL and thread ID
   */
  createProofRequest(): Observable<NDIProofRequest> {
    return this.http.post<NDIProofRequest>(`${this.apiUrl}/ndi/proof-request`, {});
  }

  /**
   * Get the status of a proof request by thread ID
   * @param threadId The thread ID from the proof request
   * @returns Observable with proof status
   */
  getProofStatus(threadId: string): Observable<NDIProofStatus> {
    return this.http.get<NDIProofStatus>(`${this.apiUrl}/ndi/proof-status/${threadId}`);
  }

  /**
   * Poll the webhook endpoint for the latest verification result
   * @returns Observable with latest proof data
   */
  getWebhookResult(): Observable<NDIWebhookResponse> {
    return this.http.get<NDIWebhookResponse>(`${this.apiUrl}/ndi-webhook`);
  }

  /**
   * Generate QR code URL for display
   * @param data The data to encode in the QR code
   * @returns QR code image URL
   */
  generateQRCodeUrl(data: string): string {
    // Using QR Server API for generating QR codes
    const size = '200x200';
    const encodedData = encodeURIComponent(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodedData}`;
  }

  /**
   * Create SSE connection for real-time NDI verification notifications
   * @param threadId Optional thread ID for targeted notifications
   * @returns Observable that emits SSE events
   */
  createSSEConnection(threadId?: string): Observable<any> {
    return new Observable(observer => {
      const url = threadId 
        ? `${this.apiUrl}/ndi-webhook/events?threadId=${threadId}`
        : `${this.apiUrl}/ndi-webhook/events`;
      
      console.log('Creating SSE connection to:', url);
      
      const eventSource = new EventSource(url);

      // Handle connection opened
      eventSource.onopen = () => {
        console.log('SSE connection opened');
        observer.next({ type: 'open', message: 'SSE connection established' });
      };

      // Handle NDI verification events
      eventSource.addEventListener('ndi-verification', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('SSE: NDI verification event received:', data);
          observer.next({ type: 'ndi-verification', data });
        } catch (error) {
          console.error('SSE: Failed to parse ndi-verification event:', error);
        }
      });

      // Handle connection events
      eventSource.addEventListener('connected', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('SSE: Connected event received:', data);
          observer.next({ type: 'connected', data });
        } catch (error) {
          console.error('SSE: Failed to parse connected event:', error);
        }
      });

      // Handle heartbeat events
      eventSource.addEventListener('heartbeat', (event) => {
        try {
          const data = JSON.parse(event.data);
          observer.next({ type: 'heartbeat', data });
        } catch (error) {
          console.error('SSE: Failed to parse heartbeat event:', error);
        }
      });

      // Handle errors
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        observer.error(error);
      };

      // Cleanup function
      return () => {
        console.log('Closing SSE connection');
        eventSource.close();
      };
    });
  }

  /**
   * Register a new user with NDI verification data
   * @param userData User registration data with NDI verification
   * @returns Observable with registration result and JWT tokens
   */
  registerNdiUser(userData: NDIUserRegistration): Observable<NDIRegistrationResponse> {
    return this.http.post<NDIRegistrationResponse>(`${this.apiUrl}/ndi/register`, userData);
  }
}
