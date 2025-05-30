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
    
    const prompt = 'Analyze this form image and extract the form title and all form fields by reading the visual content. Return the output in JSON format with the structure {forms: [{title: "Form Title", fields: []}]}. ' +
      'TITLE EXTRACTION: Look at the visual content of the form image and identify the main title or heading text that appears on the form (typically the largest, most prominent text at the top of the form). Read this text exactly as it appears visually, but clean up any duplicate words. For example, if you see "Student Leave Leave Application Application Form", extract it as "Student Leave Application Form". If no clear title text is visible on the form, set title to null. DO NOT use metadata - only read what you can see in the image. ' +
      'FIELD EXTRACTION: For each visible form field, provide: name (field label as it appears on the form), type (date/textbox/textarea/checkbox/signature), and value (default value). ' +
      'CRITICAL - FORM DATE DETECTION: ALWAYS include a "Form Date" field as the FIRST field in the fields array. Look for any date field at the top of the form such as: ' +
      '- "Date: ___" or "Date _______________" ' +
      '- "Form Date: ___" ' +
      '- Any date field in the header area ' +
      '- If no explicit date field is visible, still add: {"name": "Form Date", "type": "date", "value": ""} as the first field ' +
      '- If you find a date field, extract it as: {"name": "Form Date", "type": "date", "value": ""} or use the exact label if different ' +
      'CRITICAL - SIGNATURE FIELD DETECTION: Look specifically for signature fields which appear as: ' +
      '- "Signature: _______________" or "Applicant\'s Signature: _______________" ' +
      '- "_________________" (long underlines) with labels like "Signature", "Applicant\'s Signature", "Employee Signature", "Authorized Signature" ' +
      '- "Sign here: _______________" or similar signature prompts ' +
      '- Any field labeled with "Sign", "Signature", or similar terms followed by underlines or blank spaces ' +
      '- Extract signature fields as: {"name": "Applicant\'s Signature", "type": "signature", "value": ""} (use the exact label text that appears) ' +
      '- Common signature field labels: "Applicant\'s Signature", "Employee Signature", "Signature", "Authorized Signature", "Student Signature" ' +
      'CRITICAL - CHECKBOX GROUP DETECTION: Look specifically for checkbox sections with multiple related options under a common heading: ' +
      '- Section headings like "Document copies to be attested (Please tick wherever appropriate)" or similar instructional text ' +
      '- Multiple checkbox options listed under a section heading should be grouped together as a single checkbox group ' +
      '- For example, if you see: ' +
      '  "Document copies to be attested (Please tick wherever appropriate)" ' +
      '  ☐ College Infirmary prescription, advising rest/referral (Compulsory, if applied for medical leave) ' +
      '  ☐ Phuentsholing General Hospital prescriptions/report, advising rest/referral ' +
      '  ☐ Medical Certificate from National Hospital, if applied for long term leave (Semester /year) ' +
      '  ☐ Other documents, if any (for official/personal/ bereavement) ' +
      '- Extract this as ONE checkbox group: {"name": "Document copies to be attested (Please tick wherever appropriate)", "type": "checkbox", "value": {"College Infirmary prescription, advising rest/referral (Compulsory, if applied for medical leave)": false, "Phuentsholing General Hospital prescriptions/report, advising rest/referral": false, "Medical Certificate from National Hospital, if applied for long term leave (Semester /year)": false, "Other documents, if any (for official/personal/ bereavement)": false}} ' +
      '- Look for patterns like "Please tick", "Select all that apply", "Check all applicable", or similar instructions that indicate multiple selection options ' +
      '- Group all checkbox options that appear under the same section heading or instructional text ' +
      '- Do NOT create separate fields for each checkbox option if they belong to the same logical group ' +
      'CRITICAL - NUMBERED SECTION DETECTION: Look specifically for numbered sections like "2.3. Leave Period" or similar structured sections. When you find such sections, extract ALL sub-fields within that section: ' +
      '- For sections like "2.3. Leave Period" with "(a) From ___ (b) To ___ (c) No. of days: ___", extract as THREE separate fields: ' +
      '  {"name": "From", "type": "date", "value": ""}, {"name": "To", "type": "date", "value": ""}, {"name": "No. of days", "type": "textbox", "value": ""} ' +
      '- For checkbox sections like "3. Document copies to be attested" with multiple checkbox options, create a checkbox group with all visible options ' +
      '- ALWAYS separate numbered/lettered sub-fields (a), (b), (c) into individual field entries ' +
      '- Extract section headings as context but focus on the actual input fields within each section ' +
      'STRUCTURED FIELD SEPARATION RULES: ' +
      '- "(a) From ___" → {"name": "From", "type": "date", "value": ""} ' +
      '- "(b) To ___" → {"name": "To", "type": "date", "value": ""} ' +
      '- "(c) No. of days: ___" → {"name": "No. of days", "type": "textbox", "value": ""} ' +
      '- Date fields like "Date: ___", "From: ___", "To: ___" → type should be "date" ' +
      '- Signature fields like "Signature: _______________" → {"name": "Applicant\'s Signature", "type": "signature", "value": ""} ' +
      '- Checkbox lists with multiple options under a section heading → {"name": "Section Heading Text", "type": "checkbox", "value": {"Option 1": false, "Option 2": false, ...}} ' +
      '- Single standalone checkboxes → {"name": "Checkbox Label", "type": "checkbox", "value": false} ' +
      '- Example checkbox group: {"name": "Document copies to be attested (Please tick wherever appropriate)", "type": "checkbox", "value": {"College Infirmary prescription": false, "Hospital prescriptions/report": false, "Medical Certificate": false, "Other documents": false}} ' +
      '- ANY structure with multiple blank fields/underlines should be separated into individual fields based on their labels ' +
      '- NEVER group multiple distinct fields with different labels into a single textarea ' +
      '- Each field with its own label or prompt text should be a separate field entry ' +
      'Field types: date for date inputs (Form Date, From, To, Birth Date, etc.), textbox for single-line inputs (including numbers), textarea for multi-line text areas, checkbox for checkboxes, signature for signature fields. ' +
      'For date fields with underlines like "Date _______________", extract as: {"name": "Date", "type": "date", "value": ""} or {"name": "Form Date", "type": "date", "value": ""}. ' +
      'For signature fields with underlines like "Applicant\'s Signature: _______________", extract as: {"name": "Applicant\'s Signature", "type": "signature", "value": ""}. ' +
      'For single checkbox use: {"name": "Field Name", "type": "checkbox", "value": false}. ' +
      'For checkbox groups use: {"name": "Group Name", "type": "checkbox", "value": {"Option 1": false, "Option 2": false}}. ' +
      'Example response: {"forms": [{"title": "Employee Registration Form", "fields": [{"name": "Form Date", "type": "date", "value": ""}, {"name": "From", "type": "date", "value": ""}, {"name": "To", "type": "date", "value": ""}, {"name": "No. of days", "type": "textbox", "value": ""}, {"name": "Document copies to be attested (Please tick wherever appropriate)", "type": "checkbox", "value": {"College Infirmary prescription": false, "Hospital prescriptions/report": false, "Medical Certificate": false, "Other documents": false}}, {"name": "Applicant\'s Signature", "type": "signature", "value": ""}]}]}. ' +
      'IMPORTANT: 1) ALWAYS start with a Form Date field as the first field, 2) Extract the title by reading the actual text visible in the form image, remove any duplicate words, 3) Pay special attention to numbered sections and extract each individual input field separately, 4) Assign "date" type to all date-related fields like From, To, Date, etc., 5) Assign "signature" type to all signature fields and include them in the output.';
    
    formData.append('prompt', prompt);
    formData.append('model', 'qwen2.5vl:latest');

    return this.http.post('/api/describe-image', formData);
  }
}
