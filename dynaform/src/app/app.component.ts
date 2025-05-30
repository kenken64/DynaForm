import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { PdfUploadService } from './pdf-upload.service';
import { DescribeImageService } from './describe-image.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'dynaform';
  selectedFile: File | null = null;
  uploadMessage: string = '';
  imageUrls: string[] = [];
  generatedImageUrl: string | null = null;
  originalFieldNameMap: Record<string, string> = {};

  dynamicForm!: FormGroup;
  fields: any[] = [];
  loading = false;
  error = '';
  objectKeys = Object.keys;
  isFetchingForm = false;
  constructor(private pdfUploadService: PdfUploadService,
    private fb: FormBuilder, private describeService: DescribeImageService
  ) { }

  // Helper method to convert absolute URLs to relative URLs for production
  private normalizeImageUrl(url: string): string {
    if (environment.production) {
      // Convert absolute URLs to relative URLs
      // From: http://localhost/conversion/generated_images/...
      // To: /conversion/generated_images/...
      try {
        const urlObj = new URL(url);
        return urlObj.pathname;
      } catch {
        // If URL parsing fails, return as-is
        return url;
      }
    }
    return url;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
    }
  }  uploadPdf(): void {
    if (!this.selectedFile) {
      this.uploadMessage = 'Please select a file first.';
      return;
    }

    // Clear any previous errors
    this.error = '';

    this.pdfUploadService.uploadPdf(this.selectedFile).subscribe({
      next: response => {
        this.uploadMessage = 'Upload successful!';
        console.log(response?.accessible_urls[0]);
        // Normalize URLs for production environment
        this.imageUrls = response.accessible_urls.map(url => this.normalizeImageUrl(url));
        this.generatedImageUrl = this.imageUrls[0];
        console.log('Normalized image URLs:', this.imageUrls);
        console.log('Generated image URL:', this.generatedImageUrl);
      },
      error: err => {
        console.error(err);
        this.uploadMessage = 'Upload failed.';
        this.imageUrls = [];
        this.error = 'Failed to upload PDF. Please try again.';
      }
    });
  }
  fetchImageAndDescribe(): void {
    this.isFetchingForm = true; // Start spinner
    this.error = ''; // Clear any previous errors
    
    if (!this.generatedImageUrl) {
      this.isFetchingForm = false; // Stop spinner if no image URL
      this.error = 'No image URL available.';
      return;
    }

    this.loading = true;

    fetch(this.generatedImageUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'form_image.png', { type: blob.type });

        this.describeService.describeImage(file).subscribe({
          next: res => {
            try {
              const jsonStr = res.description.match(/```json\s*([\s\S]*?)```/)?.[1];
              if (!jsonStr) {
                this.error = 'Failed to extract JSON from response.';
                this.loading = false;
                this.isFetchingForm = false; // Stop spinner on error
                return;
              }
              console.log('Received JSON:', jsonStr);
              const parsed = JSON.parse(jsonStr);
              this.fields = parsed.forms[0].fields || [];
              this.buildForm();
              this.loading = false;
              this.isFetchingForm = false; // Stop spinner on success
            } catch (parseError) {
              this.error = 'Failed to parse JSON response.';
              this.loading = false;
              this.isFetchingForm = false; // Stop spinner on parse error
            }
          },          error: (err) => {
            console.error('Image description error:', err);
            // Provide more specific error messages based on error type
            if (err.status === 404) {
              this.error = 'The AI model is not available. Please ensure the Ollama service is running with the required model.';
            } else if (err.status === 500) {
              this.error = 'Internal server error during image analysis. Please try again.';
            } else if (err.error?.message?.includes('model') && err.error?.message?.includes('not found')) {
              this.error = 'AI model not found. The required model may still be downloading.';
            } else {
              this.error = 'Error during image description. Please try again.';
            }
            this.loading = false;
            this.isFetchingForm = false; // Stop spinner on error
          }
        });
      })
      .catch(fetchError => {
        console.error('Image fetch error:', fetchError);
        this.error = 'Failed to fetch image.';
        this.loading = false;
        this.isFetchingForm = false; // Stop spinner on fetch error
      });
  }

  buildForm(): void {
    const group: any = {};
    this.originalFieldNameMap = {};

    this.fields.forEach(field => {
      const sanitizedKey = this.sanitizeFieldName(field.name);
      this.originalFieldNameMap[sanitizedKey] = field.name;

      if (field.type === 'checkbox') {
        if (typeof field.value === 'object' && field.value !== null) {
          const nestedGroup: any = {};
          Object.entries(field.value).forEach(([key, val]) => {
            nestedGroup[key] = new FormControl(val);
          });
          group[sanitizedKey] = new FormGroup(nestedGroup);
        } else {
          group[sanitizedKey] = new FormControl(field.value);
        }
      } else {
        group[sanitizedKey] = new FormControl(field.value);
      }
    });

    this.dynamicForm = this.fb.group(group);
  }

  isFormControl(fieldName: string): boolean {
    const control = this.dynamicForm.get(fieldName);
    return !!control && !(control instanceof FormGroup);
  }

  getFormControl(fieldName: string): FormControl {
    return this.dynamicForm.get(fieldName) as FormControl;
  }

  getNestedGroup(fieldName: string): FormGroup {
    return this.dynamicForm.get(fieldName) as FormGroup;
  }

  onSubmit(): void {
    console.log('Submitted Form:', this.dynamicForm.value);
  }

  sanitizeFieldName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  // Method to clear error state and retry
  clearError(): void {
    this.error = '';
  }

  // Method to retry form generation
  retryFormGeneration(): void {
    this.clearError();
    this.fetchImageAndDescribe();
  }
}
