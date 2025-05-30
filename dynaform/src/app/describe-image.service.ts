import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DescribeImageService {
  constructor(private http: HttpClient) {}

  describeImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('imageFile', file);
    
    const prompt = 'Analyze this form image and identify all form fields. Return the output in JSON format with the structure {forms: [{fields: []}]}. ' +
      'For each field, provide: name (field label), type (textbox/textarea/checkbox), and value (default value). ' +
      'Field types: textbox for single-line inputs, textarea for multi-line text areas, checkbox for checkboxes. ' +
      'For single checkbox use: {"name": "Field Name", "type": "checkbox", "value": false}. ' +
      'For checkbox groups use: {"name": "Group Name", "type": "checkbox", "value": {"Option 1": false, "Option 2": false}}.';
    
    formData.append('prompt', prompt);
    formData.append('model', 'qwen2.5vl:latest');

    return this.http.post('/api/describe-image', formData);
  }
}
