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
    formData.append('prompt', 'List all the form fields format the output in json (make sure structure {forms:[ fields: []]}) and also provide the field type whether it is a textbox or checkbox');
    formData.append('model', 'qwen2.5vl:latest');

    return this.http.post('/api/describe-image', formData);
  }
}
