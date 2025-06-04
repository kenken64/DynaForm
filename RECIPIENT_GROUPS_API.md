# Recipient Groups API Documentation

## Overview
The Recipient Groups API allows users to create, manage, and search groups of recipients using alias names. This enables organizing recipients into logical groups for easier management and bulk operations.

## Base URL
```
http://localhost:3000/api/recipient-groups
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Data Models

### RecipientGroup
```typescript
interface RecipientGroup {
  _id?: string;
  aliasName: string;           // Unique alias name for the group
  description?: string;        // Optional description
  recipientIds: string[];      // Array of recipient IDs
  createdAt?: string;         // ISO date string
  updatedAt?: string;         // ISO date string  
  createdBy: string;          // User ID of the creator
}
```

### API Responses
```typescript
interface RecipientGroupListResponse {
  success: boolean;
  groups: RecipientGroup[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface RecipientGroupResponse {
  success: boolean;
  message?: string;
  group?: RecipientGroup;
  error?: string;
}
```

## Endpoints

### 1. Create Recipient Group
**POST** `/api/recipient-groups`

Creates a new recipient group with the specified alias name and recipients.

**Request Body:**
```json
{
  "aliasName": "VIP Customers",
  "description": "High-value customers requiring special attention",
  "recipientIds": ["650a1234567890abcdef1234", "650a1234567890abcdef5678"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Recipient group created successfully",
  "group": {
    "_id": "650a1234567890abcdef9999",
    "aliasName": "VIP Customers",
    "description": "High-value customers requiring special attention",
    "recipientIds": ["650a1234567890abcdef1234", "650a1234567890abcdef5678"],
    "createdAt": "2025-06-04T10:30:00.000Z",
    "updatedAt": "2025-06-04T10:30:00.000Z",
    "createdBy": "user123"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors (missing fields, duplicate alias)
- `401 Unauthorized` - Invalid or missing authentication token

---

### 2. Get Recipient Groups
**GET** `/api/recipient-groups`

Retrieves a paginated list of recipient groups for the authenticated user.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `pageSize` (optional, default: 10) - Number of items per page
- `search` (optional) - Search term for alias name or description

**Examples:**
```
GET /api/recipient-groups
GET /api/recipient-groups?page=2&pageSize=20
GET /api/recipient-groups?search=VIP
```

**Response (200 OK):**
```json
{
  "success": true,
  "groups": [
    {
      "_id": "650a1234567890abcdef9999",
      "aliasName": "VIP Customers",
      "description": "High-value customers requiring special attention",
      "recipientIds": ["650a1234567890abcdef1234", "650a1234567890abcdef5678"],
      "createdAt": "2025-06-04T10:30:00.000Z",
      "updatedAt": "2025-06-04T10:30:00.000Z",
      "createdBy": "user123"
    }
  ],
  "totalCount": 15,
  "page": 1,
  "pageSize": 10,
  "totalPages": 2
}
```

---

### 3. Get Specific Recipient Group
**GET** `/api/recipient-groups/:id`

Retrieves a specific recipient group by its ID.

**Response (200 OK):**
```json
{
  "success": true,
  "group": {
    "_id": "650a1234567890abcdef9999",
    "aliasName": "VIP Customers",
    "description": "High-value customers requiring special attention",
    "recipientIds": ["650a1234567890abcdef1234", "650a1234567890abcdef5678"],
    "createdAt": "2025-06-04T10:30:00.000Z",
    "updatedAt": "2025-06-04T10:30:00.000Z",
    "createdBy": "user123"
  }
}
```

**Error Responses:**
- `404 Not Found` - Group not found or doesn't belong to user

---

### 4. Update Recipient Group
**PUT** `/api/recipient-groups/:id`

Updates an existing recipient group.

**Request Body (partial updates allowed):**
```json
{
  "aliasName": "Premium VIP Customers",
  "description": "Updated description",
  "recipientIds": ["650a1234567890abcdef1234", "650a1234567890abcdef5678", "650a1234567890abcdef9999"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Recipient group updated successfully",
  "group": {
    "_id": "650a1234567890abcdef9999",
    "aliasName": "Premium VIP Customers",
    "description": "Updated description",
    "recipientIds": ["650a1234567890abcdef1234", "650a1234567890abcdef5678", "650a1234567890abcdef9999"],
    "createdAt": "2025-06-04T10:30:00.000Z",
    "updatedAt": "2025-06-04T12:45:00.000Z",
    "createdBy": "user123"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors (duplicate alias, invalid recipient IDs)
- `404 Not Found` - Group not found or doesn't belong to user

---

### 5. Delete Recipient Group
**DELETE** `/api/recipient-groups/:id`

Deletes a recipient group. This action cannot be undone.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Recipient group deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Group not found or doesn't belong to user

---

### 6. Search Groups by Alias
**GET** `/api/recipient-groups/search`

Searches for groups by alias name (case-insensitive).

**Query Parameters:**
- `alias` (required) - The alias name to search for

**Example:**
```
GET /api/recipient-groups/search?alias=VIP
```

**Response (200 OK):**
```json
{
  "success": true,
  "groups": [
    {
      "_id": "650a1234567890abcdef9999",
      "aliasName": "VIP Customers",
      "description": "High-value customers",
      "recipientIds": ["650a1234567890abcdef1234"],
      "createdAt": "2025-06-04T10:30:00.000Z",
      "updatedAt": "2025-06-04T10:30:00.000Z",
      "createdBy": "user123"
    }
  ]
}
```

---

### 7. Get Groups with Recipient Details
**GET** `/api/recipient-groups/with-recipients`

Retrieves all groups with populated recipient information.

**Response (200 OK):**
```json
{
  "success": true,
  "groups": [
    {
      "_id": "650a1234567890abcdef9999",
      "aliasName": "VIP Customers",
      "description": "High-value customers",
      "recipientIds": ["650a1234567890abcdef1234"],
      "createdAt": "2025-06-04T10:30:00.000Z",
      "updatedAt": "2025-06-04T10:30:00.000Z",
      "createdBy": "user123",
      "recipients": [
        {
          "_id": "650a1234567890abcdef1234",
          "name": "John Doe",
          "email": "john.doe@company.com",
          "jobTitle": "CEO",
          "companyName": "Tech Corp"
        }
      ]
    }
  ]
}
```

---

### 8. Export Recipient Groups
**GET** `/api/recipient-groups/export`

Exports all recipient groups as a CSV file.

**Response (200 OK):**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="recipient-groups.csv"`

**CSV Format:**
```csv
"Alias Name","Description","Recipient Count","Recipients","Created At"
"VIP Customers","High-value customers","2","John Doe (john@company.com); Jane Smith (jane@corp.com)","2025-06-04T10:30:00.000Z"
```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

### Common Error Status Codes:
- `400 Bad Request` - Invalid input data, validation errors
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Resource not found or access denied
- `500 Internal Server Error` - Server-side errors

## Validation Rules

### Alias Name:
- Required field
- Must be unique per user
- Trimmed of whitespace
- Case-sensitive storage, case-insensitive search

### Description:
- Optional field
- Trimmed of whitespace
- Can be empty string

### Recipient IDs:
- Must be an array with at least one valid recipient ID
- All IDs must exist and belong to the authenticated user
- Must be valid MongoDB ObjectId format

## Database Schema

### MongoDB Collection: `recipientGroups`

**Indexes:**
- `{ "createdBy": 1, "createdAt": -1 }` - User queries with date sorting
- `{ "aliasName": "text", "description": "text" }` - Text search
- `{ "aliasName": 1, "createdBy": 1 }` - Unique constraint
- `{ "recipientIds": 1 }` - Recipient lookups
- `{ "updatedAt": -1 }` - Date-based queries

## Usage Examples

### Frontend Integration (Angular)
```typescript
// Service method example
async createRecipientGroup(group: CreateRecipientGroupRequest): Promise<RecipientGroupResponse> {
  const headers = {
    'Authorization': `Bearer ${this.authService.getToken()}`,
    'Content-Type': 'application/json'
  };
  
  const response = await this.http.post<RecipientGroupResponse>(
    `${this.apiUrl}/recipient-groups`,
    group,
    { headers }
  ).toPromise();
  
  return response;
}
```

### cURL Examples
```bash
# Create a new group
curl -X POST http://localhost:3000/api/recipient-groups \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "aliasName": "VIP Customers",
    "description": "High-value customers",
    "recipientIds": ["650a1234567890abcdef1234"]
  }'

# Search groups
curl -X GET "http://localhost:3000/api/recipient-groups/search?alias=VIP" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Export groups
curl -X GET http://localhost:3000/api/recipient-groups/export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output recipient-groups.csv
```
