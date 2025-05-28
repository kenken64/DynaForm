import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { PdfUploadService } from './pdf-upload.service';
import { DescribeImageService } from './describe-image.service';

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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
    }
  }

  uploadPdf(): void {
    if (!this.selectedFile) {
      this.uploadMessage = 'Please select a file first.';
      return;
    }

    this.pdfUploadService.uploadPdf(this.selectedFile).subscribe({
      next: response => {
        this.uploadMessage = 'Upload successful!';
        console.log(response?.accessible_urls[0]);
        this.imageUrls = response.accessible_urls;
        this.generatedImageUrl = this.imageUrls[0];
        console.log(this.imageUrls);
        console.log(this.generatedImageUrl);
      },
      error: err => {
        console.error(err);
        this.uploadMessage = 'Upload failed.';
        this.imageUrls = [];
      }
    });
  }

  fetchImageAndDescribe(): void {
    this.isFetchingForm = true; // Start spinner
    if (!this.generatedImageUrl) return;

    this.loading = true;

    fetch(this.generatedImageUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'form_image.png', { type: blob.type });

        this.describeService.describeImage(file).subscribe({
          next: res => {
            const jsonStr = res.description.match(/```json\s*([\s\S]*?)```/)?.[1];
            if (!jsonStr) {
              this.error = 'Failed to extract JSON from response.';
              this.loading = false;
              return;
            }
            console.log('Received JSON:', jsonStr);
            const parsed = JSON.parse(jsonStr);
            this.fields = parsed.forms[0].fields || [];
            this.buildForm();
            this.loading = false;
          },
          error: () => {
            this.error = 'Error during image description.';
            this.loading = false;
          },
          complete: () => {
            this.isFetchingForm = false; // Stop spinner
          }
        });
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
}
