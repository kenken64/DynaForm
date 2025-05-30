# Form Data Submission API

This document describes the new API endpoints for capturing and managing form field data submissions.

## Overview

The Form Data Submission API allows users to submit filled form data to the `forms_data` MongoDB collection using upsert operations. This is separate from the form template management and focuses on actual user submissions.

## API Endpoints

### 1. Submit Form Data (Upsert)

**Endpoint:** `POST /api/forms-data`

**Description:** Saves or updates form data submission using upsert operation.

**Request Body:**
```json
{
  "formId": "string (required)",
  "formTitle": "string (optional)",
  "formData": {
    "Field Name": {
      "fieldName": "Original Field Name",
      "fieldType": "textbox|textarea|checkbox|date|number|signature",
      "value": "submitted value",
      "sanitizedKey": "sanitized_field_name"
    }
  },
  "userInfo": {
    "userId": "string (required)",
    "username": "string (optional)",
    "submittedBy": "string (required)"
  },
  "submissionMetadata": {
    "formVersion": "string",
    "totalFields": "number",
    "filledFields": "number"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Form data saved successfully",
  "formId": "string",
  "isNewSubmission": boolean,
  "submittedAt": "ISO timestamp"
}
```

### 2. Get Form Data

**Endpoint:** `GET /api/forms-data/:formId?userId=<userId>`

**Description:** Retrieves form data submission for a specific form and optionally for a specific user.

**Response:**
```json
{
  "success": true,
  "formData": {
    "_id": "MongoDB ObjectId",
    "formId": "string",
    "formTitle": "string",
    "formData": { /* form field data */ },
    "userInfo": { /* user information */ },
    "submissionMetadata": { /* submission metadata */ },
    "updatedAt": "ISO timestamp"
  }
}
```

### 3. Get All Submissions for a Form

**Endpoint:** `GET /api/forms-data/submissions/:formId?page=1&pageSize=10`

**Description:** Retrieves all submissions for a specific form with pagination.

**Response:**
```json
{
  "success": true,
  "count": "number",
  "page": "number",
  "pageSize": "number", 
  "totalPages": "number",
  "submissions": [ /* array of form submissions */ ]
}
```

## Database Structure

### Collection: `forms_data`

Each document in the `forms_data` collection represents a form submission:

```json
{
  "_id": "ObjectId",
  "formId": "string",
  "formTitle": "string",
  "formData": {
    "Field Name": {
      "fieldName": "Original Field Name",
      "fieldType": "field type",
      "value": "submitted value",
      "sanitizedKey": "sanitized key"
    }
  },
  "userInfo": {
    "userId": "string",
    "username": "string",
    "submittedBy": "string"
  },
  "submissionMetadata": {
    "submittedAt": "ISO timestamp",
    "ipAddress": "string",
    "userAgent": "string",
    "formVersion": "string",
    "totalFields": "number",
    "filledFields": "number"
  },
  "updatedAt": "ISO timestamp"
}
```

## Frontend Integration

### Form Viewer Component

The form viewer component now includes:

1. **Submit Form Data Button** - Saves user-filled form data to the `forms_data` collection
2. **Update Button** - Updates the form template in the `generated_form` collection (existing functionality)

### Usage

```typescript
// In the form viewer component
saveFormData(): void {
  // Captures all form field values
  // Submits to /api/forms-data endpoint
  // Shows success/error feedback
}
```

## Key Features

- **Upsert Operation**: Prevents duplicate submissions for the same user and form
- **Type Safety**: Uses TypeScript interfaces for better code reliability
- **User Tracking**: Associates submissions with authenticated users
- **Metadata Capture**: Records submission timestamp, IP address, and form statistics
- **Separate from Templates**: Form data submissions are stored separately from form templates
- **Pagination Support**: API supports paginated retrieval of submissions

## Testing

To test the form data submission:

1. Navigate to a form in the Form Viewer
2. Fill out the form fields
3. Click "Submit Form Data" button
4. Check the console for submission confirmation
5. Verify data in MongoDB `forms_data` collection

## Error Handling

The API includes comprehensive error handling for:
- Missing required fields
- Invalid form data
- Database connection issues
- Authentication problems
- Validation errors

All errors return appropriate HTTP status codes and descriptive error messages.
