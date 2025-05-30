# doc2formjson API - Modular Architecture

This project has been refactored from a monolithic `server.ts` file into a clean, modular Express.js application following best practices for maintainability, scalability, and testability.

## 🏗️ Project Structure

```
src/
├── app.ts                 # Express app configuration and setup
├── index.ts              # Application entry point
├── config/               # Configuration management
│   └── index.ts          # Environment variables and app config
├── controllers/          # Request/response handlers
│   ├── index.ts
│   ├── imageController.ts    # Image analysis endpoints
│   ├── formController.ts     # Form CRUD operations
│   └── formDataController.ts # Form submission data
├── database/             # Database connection and management
│   └── connection.ts     # MongoDB connection setup
├── middleware/           # Express middleware
│   ├── index.ts          # Common middleware (CORS, error handling)
│   └── upload.ts         # File upload configuration
├── routes/               # API route definitions
│   ├── index.ts          # Route aggregator
│   ├── imageRoutes.ts    # Image analysis routes
│   ├── formRoutes.ts     # Form management routes
│   └── formDataRoutes.ts # Form data submission routes
├── services/             # Business logic layer
│   ├── index.ts
│   ├── ollamaService.ts      # Ollama AI integration
│   ├── formService.ts        # Form business logic
│   └── formDataService.ts    # Form data operations
├── types/                # TypeScript type definitions
│   └── index.ts          # Shared interfaces and types
└── utils/                # Utility functions
    ├── index.ts
    ├── pagination.ts     # Pagination helpers
    └── validation.ts     # Validation utilities
```

## 🚀 Getting Started

### Development
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Start legacy monolithic server (backup)
npm run dev:legacy
```

### Production
```bash
# Build the project
npm run build

# Start production server
npm start
```

## 📋 API Endpoints

### Image Analysis
- `POST /api/describe-image` - Analyze image using Ollama AI
- `GET /api/healthcheck` - Service health check

### Form Management
- `POST /api/forms` - Create new form
- `GET /api/forms` - List forms (paginated)
- `GET /api/forms/search` - Search forms
- `GET /api/forms/:id` - Get specific form
- `PUT /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form

### Form Data Submissions
- `POST /api/forms-data` - Save form submission
- `GET /api/forms-data/:formId` - Get form data
- `GET /api/forms-data/submissions/:formId` - Get all submissions for form
- `DELETE /api/forms-data/:formId` - Delete form data
- `DELETE /api/forms-data/submissions/:formId` - Delete all submissions

## 🏛️ Architecture Patterns

### Layered Architecture
1. **Routes Layer** - HTTP request routing and parameter extraction
2. **Controllers Layer** - Request/response handling and input validation
3. **Services Layer** - Business logic and data processing
4. **Database Layer** - Data persistence and queries

### Key Features
- **Separation of Concerns** - Each layer has distinct responsibilities
- **Dependency Injection** - Services are injected into controllers
- **Error Handling** - Centralized error handling middleware
- **Type Safety** - Full TypeScript coverage with strict types
- **Configuration Management** - Environment-based configuration
- **Graceful Shutdown** - Proper cleanup on process termination

## 🔧 Configuration

Environment variables are managed in `src/config/index.ts`:

```typescript
export const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'doc2formjson',
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    DEFAULT_MODEL_NAME: process.env.DEFAULT_QWEN_MODEL_NAME || 'qwen:7b',
    // ... other config options
};
```

## 🛡️ Error Handling

The application includes comprehensive error handling:

- **Global Error Middleware** - Catches and formats all errors
- **Validation Errors** - Input validation with descriptive messages
- **Database Errors** - MongoDB operation error handling
- **Service Errors** - External service (Ollama) error handling
- **404 Handler** - Handles unknown routes gracefully

## 📊 Response Format

All API responses follow a consistent format:

```typescript
// Success Response
{
    "success": true,
    "data": {...},
    "pagination": {...}  // For paginated endpoints
}

// Error Response
{
    "success": false,
    "error": "Error message",
    "message": "Detailed error description"
}
```

## 🧪 Testing

The modular structure makes testing easier:

- **Unit Tests** - Test individual services and utilities
- **Integration Tests** - Test controller and route combinations
- **End-to-End Tests** - Test complete API workflows

## 📈 Benefits of Refactoring

### Before (Monolithic)
- ❌ 597 lines in single file
- ❌ Mixed concerns (routing, business logic, database)
- ❌ Difficult to test individual components
- ❌ Hard to maintain and extend
- ❌ No clear separation of responsibilities

### After (Modular)
- ✅ Clear separation of concerns
- ✅ Easier to test and maintain
- ✅ Better code organization
- ✅ Improved error handling
- ✅ Type safety throughout
- ✅ Configuration management
- ✅ Follows Express.js best practices

## 🔄 Migration Notes

The original monolithic `server.ts` has been backed up as `server.ts.backup`. The new modular structure maintains 100% API compatibility while providing better:

- Code organization
- Maintainability
- Testability
- Scalability
- Developer experience

All existing functionality has been preserved and enhanced with better error handling and type safety.

## 🚨 Breaking Changes

None! The refactored API maintains complete backward compatibility with the original implementation.

## 📝 Development Guidelines

1. **Services** - Keep business logic in service classes
2. **Controllers** - Handle HTTP concerns only
3. **Routes** - Define endpoints and middleware
4. **Types** - Maintain strong typing throughout
5. **Error Handling** - Use proper error throwing and catching
6. **Configuration** - Use environment variables for all config

This modular architecture provides a solid foundation for future development and makes the codebase much more maintainable and testable.
