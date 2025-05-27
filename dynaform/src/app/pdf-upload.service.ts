import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PdfUploadResponse } from './pdf-upload-response.model';


@Injectable({
  providedIn: 'root'
})
export class PdfUploadService {
  
  private uploadUrl = '/conversion/pdf-to-png-save';

  constructor(private http: HttpClient) {}

  uploadPdf(file: File): Observable<PdfUploadResponse> {
    const formData = new FormData();
    formData.append('pdfFile', file);

    return this.http.post<PdfUploadResponse>(this.uploadUrl, formData);
  }
}