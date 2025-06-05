# Form Field Extraction Prompt Documentation

This document describes the comprehensive prompt used by the doc2formjson application for extracting form fields from images using AI vision models.

## Overview

The prompt is designed to analyze form images and extract structured data in JSON format, specifically targeting:
- Form titles
- All visible form fields with their types and properties
- Special handling for dates, signatures, checkboxes, and numbered sections

## Prompt Structure

### Base Instruction
```
Analyze this form image and extract the form title and all form fields by reading the visual content. Return the output in JSON format with the structure {forms: [{title: "Form Title", fields: []}]}.
```

### Expected JSON Output Format
```json
{
  "forms": [
    {
      "title": "Form Title",
      "fields": [
        {
          "name": "Field Name",
          "type": "field_type",
          "value": "default_value"
        }
      ]
    }
  ]
}
```

## Title Extraction Rules

### Visual Content Analysis
- Look at the visual content of the form image
- Identify the main title or heading text (typically largest, most prominent text at the top)
- Read text exactly as it appears visually
- Clean up duplicate words (e.g., "Student Leave Leave Application Application Form" → "Student Leave Application Form")
- If no clear title is visible, set title to `null`
- **DO NOT use metadata** - only read what's visible in the image

## Field Extraction Rules

### General Field Properties
For each visible form field, provide:
- **name**: Field label as it appears on the form
- **type**: One of: `date`, `textbox`, `textarea`, `checkbox`, `signature`
- **value**: Default value (usually empty string or false for checkboxes)

### Field Type Definitions
- **date**: Date inputs (Form Date, From, To, Birth Date, etc.)
- **textbox**: Single-line text inputs (including numbers)
- **textarea**: Multi-line text areas
- **checkbox**: Checkbox inputs (single or grouped)
- **signature**: Signature fields

## Critical Detection Rules

### 1. Form Date Detection (CRITICAL)
**ALWAYS include a "Form Date" field as the FIRST field** in the fields array.

#### Look for:
- `"Date: ___"` or `"Date _______________"`
- `"Form Date: ___"`
- Any date field in the header area

#### Rules:
- If no explicit date field is visible, still add: `{"name": "Form Date", "type": "date", "value": ""}`
- If date field found, extract as: `{"name": "Form Date", "type": "date", "value": ""}` or use exact label

#### Example:
```json
{"name": "Form Date", "type": "date", "value": ""}
```

### 2. Signature Field Detection (CRITICAL)

#### Look for:
- `"Signature: _______________"` or `"Applicant's Signature: _______________"`
- `"_________________"` (long underlines) with signature labels
- `"Sign here: _______________"` or similar prompts
- Any field labeled with "Sign", "Signature", or similar terms

#### Common Labels:
- Applicant's Signature
- Employee Signature
- Signature
- Authorized Signature
- Student Signature

#### Example:
```json
{"name": "Applicant's Signature", "type": "signature", "value": ""}
```

### 3. Checkbox Group Detection (CRITICAL)

#### Identify Grouped Checkboxes:
- Section headings like "Document copies to be attested (Please tick wherever appropriate)"
- Multiple checkbox options under a common heading
- Patterns like "Please tick", "Select all that apply", "Check all applicable"

#### Grouping Rules:
- **Group related checkboxes** under same section heading
- **Do NOT create separate fields** for each checkbox in a group
- Use section heading as the field name

#### Example Input:
```
Document copies to be attested (Please tick wherever appropriate)
☐ College Infirmary prescription, advising rest/referral (Compulsory, if applied for medical leave)
☐ Phuentsholing General Hospital prescriptions/report, advising rest/referral
☐ Medical Certificate from National Hospital, if applied for long term leave (Semester /year)
☐ Other documents, if any (for official/personal/ bereavement)
```

#### Example Output:
```json
{
  "name": "Document copies to be attested (Please tick wherever appropriate)",
  "type": "checkbox",
  "value": {
    "College Infirmary prescription, advising rest/referral (Compulsory, if applied for medical leave)": false,
    "Phuentsholing General Hospital prescriptions/report, advising rest/referral": false,
    "Medical Certificate from National Hospital, if applied for long term leave (Semester /year)": false,
    "Other documents, if any (for official/personal/ bereavement)": false
  }
}
```

### 4. Numbered Section Detection (CRITICAL)

#### Look for:
- Numbered sections like "2.3. Leave Period"
- Structured sections with sub-fields
- Lettered sub-fields: (a), (b), (c)

#### Rules:
- **Extract ALL sub-fields** within each section
- **Separate numbered/lettered sub-fields** into individual entries
- Focus on actual input fields, not section headings

#### Example Input:
```
2.3. Leave Period
(a) From ___
(b) To ___
(c) No. of days: ___
```

#### Example Output:
```json
[
  {"name": "From", "type": "date", "value": ""},
  {"name": "To", "type": "date", "value": ""},
  {"name": "No. of days", "type": "textbox", "value": ""}
]
```

## Structured Field Separation Rules

### Mapping Patterns:
- `"(a) From ___"` → `{"name": "From", "type": "date", "value": ""}`
- `"(b) To ___"` → `{"name": "To", "type": "date", "value": ""}`
- `"(c) No. of days: ___"` → `{"name": "No. of days", "type": "textbox", "value": ""}`
- Date fields → `type: "date"`
- Signature fields → `type: "signature"`
- Checkbox lists → Grouped checkbox with multiple options
- Single checkboxes → `{"name": "Label", "type": "checkbox", "value": false}`

### Key Principles:
- **ANY structure with multiple blank fields/underlines** should be separated based on labels
- **NEVER group multiple distinct fields** with different labels into a single textarea
- **Each field with its own label** should be a separate field entry

## Field Type Examples

### Date Fields
```json
{"name": "Date", "type": "date", "value": ""}
{"name": "Form Date", "type": "date", "value": ""}
```

### Signature Fields
```json
{"name": "Applicant's Signature", "type": "signature", "value": ""}
```

### Single Checkboxes
```json
{"name": "Field Name", "type": "checkbox", "value": false}
```

### Checkbox Groups
```json
{
  "name": "Group Name",
  "type": "checkbox",
  "value": {
    "Option 1": false,
    "Option 2": false
  }
}
```

## Complete Example Response

```json
{
  "forms": [
    {
      "title": "Employee Registration Form",
      "fields": [
        {"name": "Form Date", "type": "date", "value": ""},
        {"name": "From", "type": "date", "value": ""},
        {"name": "To", "type": "date", "value": ""},
        {"name": "No. of days", "type": "textbox", "value": ""},
        {
          "name": "Document copies to be attested (Please tick wherever appropriate)",
          "type": "checkbox",
          "value": {
            "College Infirmary prescription": false,
            "Hospital prescriptions/report": false,
            "Medical Certificate": false,
            "Other documents": false
          }
        },
        {"name": "Applicant's Signature", "type": "signature", "value": ""}
      ]
    }
  ]
}
```

## Important Guidelines

1. **ALWAYS start with a Form Date field** as the first field
2. **Extract the title** by reading actual text visible in the form image, remove duplicate words
3. **Pay special attention to numbered sections** and extract each individual input field separately
4. **Assign "date" type** to all date-related fields like From, To, Date, etc.
5. **Assign "signature" type** to all signature fields and include them in the output

## Usage in Application

This prompt is used by the `DescribeImageService` in the Angular frontend to communicate with the Ollama API through the Node.js backend. The prompt ensures consistent and structured extraction of form data from images for the doc2formjson application.
