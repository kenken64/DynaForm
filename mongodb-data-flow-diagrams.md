# MongoDB Data Flow Diagrams

## 1. User Authentication Data Flow

```mermaid
flowchart TD
    A[HTTP Request<br/>POST /api/auth/register] --> B[Auth Controller<br/>Validates Input]
    B --> C{User Exists Check}
    C -->|Query| D[(MongoDB Users Collection<br/>findOne by email/username)]
    D -->|Exists| E[Return 409 Conflict]
    D -->|Not Found| F[Auth Service<br/>Create User Document]
    F --> G[Generate User Object]
    G --> H[Password Hashing<br/>+ Metadata Addition]
    H --> I[(MongoDB Users Collection<br/>insertOne)]
    I --> J[Generate JWT Tokens]
    J --> K[HTTP Response<br/>201 Created + Tokens]
    
    %% Passkey Flow
    L[HTTP Request<br/>POST /api/auth/passkey/register] --> M[Generate Challenge]
    M --> N[WebAuthn Service<br/>Create Options]
    N --> O[Store Challenge<br/>in Memory/Cache]
    O --> P[Return Challenge to Client]
    
    Q[HTTP Request<br/>POST /api/auth/passkey/verify] --> R[Verify Response]
    R --> S[Update User Document]
    S --> T[(MongoDB Users Collection<br/>updateOne - Add Passkey)]
    T --> U[Return Success]

    style D fill:#e1f5fe
    style I fill:#e1f5fe
    style T fill:#e1f5fe
```

## 2. Form Creation and Management Data Flow

```mermaid
flowchart TD
    A[HTTP Request<br/>POST /api/forms/save] --> B[Form Controller<br/>Extract User from JWT]
    B --> C[Form Service<br/>Process Form Data]
    C --> D[Generate JSON Fingerprint<br/>crypto.createHash]
    D --> E[Create Form Metadata]
    E --> F[Generate Form Object]
    
    F --> G{PDF Provided?}
    G -->|Yes| H[Extract PDF Fingerprint<br/>from pdfMetadata]
    G -->|No| I[Use JSON Fingerprint<br/>as identifier]
    
    H --> J[Create GeneratedForm Document]
    I --> J
    J --> K[(MongoDB generated_form Collection<br/>insertOne)]
    K --> L[Return Form with _id]
    L --> M[HTTP Response<br/>201 Created]
    
    %% Form Retrieval Flow
    N[HTTP Request<br/>GET /api/forms] --> O[Form Controller<br/>Extract userId]
    O --> P[Form Service<br/>Apply Filters]
    P --> Q[Build Query Object]
    Q --> R[(MongoDB generated_form Collection<br/>find + pagination)]
    R --> S[Apply User Filter<br/>metadata.createdBy.userId]
    S --> T[Sort by Creation Date]
    T --> U[Calculate Pagination]
    U --> V[HTTP Response<br/>Paginated Results]
    
    %% Form Search Flow
    W[HTTP Request<br/>GET /api/forms/search?q=invoice] --> X[Build Search Query]
    X --> Y[Regex Pattern Creation]
    Y --> Z[(MongoDB generated_form Collection<br/>find with $regex)]
    Z --> AA[Filter by User + Search]
    AA --> BB[Return Matching Forms]

    style K fill:#e1f5fe
    style R fill:#e1f5fe
    style Z fill:#e1f5fe
```

## 3. Form Submission Data Flow

```mermaid
flowchart TD
    A[HTTP Request<br/>POST /api/forms-data/save] --> B[FormData Controller<br/>Extract Request Metadata]
    B --> C[Add Submission Context]
    C --> D[FormData Service<br/>Process Submission]
    D --> E[Create Submission Object]
    E --> F[Add Metadata<br/>IP, UserAgent, Timestamp]
    F --> G[(MongoDB form_submissions Collection<br/>insertOne)]
    G --> H[Return Submission ID]
    H --> I[HTTP Response<br/>201 Created]
    
    %% Form Data Retrieval Flow
    J[HTTP Request<br/>GET /api/forms-data/:formId] --> K[FormData Controller<br/>Validate Access]
    K --> L[FormData Service<br/>Build Query]
    L --> M[(MongoDB form_submissions Collection<br/>find by formId)]
    M --> N[Apply Pagination]
    N --> O[Sort by Submission Date]
    O --> P[HTTP Response<br/>Paginated Submissions]
    
    %% Advanced Search Flow
    Q[HTTP Request<br/>POST /api/forms-data/search] --> R[Build Complex Query]
    R --> S[Dynamic Field Search<br/>$objectToArray Pipeline]
    S --> T{Search Type}
    T -->|Field Values| U[Regex Match on formData]
    T -->|Form Title| V[Text Search on formTitle]
    T -->|User Info| W[Search userInfo fields]
    
    U --> X[(MongoDB Aggregation Pipeline)]
    V --> X
    W --> X
    X --> Y[$filter Dynamic Fields]
    Y --> Z[$match Conditions]
    Z --> AA[Return Matching Submissions]
    
    %% Export Flow
    BB[HTTP Request<br/>GET /api/forms-data/export] --> CC[Gather All Submissions]
    CC --> DD[(MongoDB form_submissions Collection<br/>find all by user)]
    DD --> EE[Transform to Excel Format]
    EE --> FF[Generate XLSX Buffer]
    FF --> GG[HTTP Response<br/>Excel Download]

    style G fill:#e1f5fe
    style M fill:#e1f5fe
    style X fill:#e1f5fe
    style DD fill:#e1f5fe
```

## 4. Public Form Submission Data Flow

```mermaid
flowchart TD
    A[HTTP Request<br/>POST /api/public/forms/:formId/submit] --> B[Public Controller<br/>Validate Form Access]
    B --> C[(MongoDB generated_form Collection<br/>findOne by formId)]
    C --> D{Form Exists &<br/>Status = verified?}
    D -->|No| E[Return 404 Not Found]
    D -->|Yes| F[Extract Form Creator Info]
    F --> G[Public Service<br/>Process Submission]
    G --> H[Create Public Submission]
    H --> I[Add Creator's userInfo<br/>from form metadata]
    I --> J[(MongoDB public_form_submissions Collection<br/>insertOne)]
    J --> K[HTTP Response<br/>201 Created]
    
    %% Public Form Retrieval
    L[HTTP Request<br/>GET /api/public/forms/:formId] --> M[Validate Public Access]
    M --> N[(MongoDB generated_form Collection<br/>findOne + status check)]
    N --> O{Public & Verified?}
    O -->|No| P[Return 403 Forbidden]
    O -->|Yes| Q[Return Form Definition]
    
    %% Aggregated Public Submissions
    R[HTTP Request<br/>GET /api/public/submissions/aggregated] --> S[Public Service<br/>Build Aggregation]
    S --> T[(MongoDB Aggregation Pipeline<br/>public_form_submissions)]
    T --> U[$lookup with generated_form]
    U --> V[$group by formId]
    V --> W[Count Submissions<br/>+ Latest Timestamp]
    W --> X[$sort by Count DESC]
    X --> Y[Return Aggregated Data]
    
    %% Export Public Submissions
    Z[HTTP Request<br/>GET /api/public/export/:formId] --> AA[Validate Form Access]
    AA --> BB[(MongoDB public_form_submissions Collection<br/>find by formId)]
    BB --> CC[Transform Data Structure]
    CC --> DD[Generate Excel Headers<br/>from Form Definition]
    DD --> EE[Create XLSX Buffer]
    EE --> FF[HTTP Response<br/>Excel Download]

    style C fill:#e1f5fe
    style J fill:#e1f5fe
    style N fill:#e1f5fe
    style T fill:#e1f5fe
    style BB fill:#e1f5fe
```

## 5. Recipient Management Data Flow

```mermaid
flowchart TD
    A[HTTP Request<br/>POST /api/recipients] --> B[Recipient Controller<br/>Validate Input]
    B --> C[Check Email Uniqueness<br/>per User]
    C --> D[(MongoDB recipients Collection<br/>findOne by email + userId)]
    D --> E{Email Exists<br/>for User?}
    E -->|Yes| F[Return 409 Conflict]
    E -->|No| G[Recipient Service<br/>Create Recipient]
    G --> H[Add User Ownership<br/>+ Timestamps]
    H --> I[(MongoDB recipients Collection<br/>insertOne)]
    I --> J[HTTP Response<br/>201 Created]
    
    %% Recipient Groups Flow
    K[HTTP Request<br/>POST /api/recipient-groups] --> L[Validate Recipients<br/>Belong to User]
    L --> M[(MongoDB recipients Collection<br/>find by recipientIds)]
    M --> N{All Recipients<br/>Valid & Owned?}
    N -->|No| O[Return 400 Bad Request]
    N -->|Yes| P[Create Recipient Group]
    P --> Q[Store Recipient References<br/>as ObjectId Array]
    Q --> R[(MongoDB recipientGroups Collection<br/>insertOne)]
    R --> S[HTTP Response<br/>201 Created]
    
    %% Export Recipients
    T[HTTP Request<br/>GET /api/recipients/export] --> U[Recipient Service<br/>Get All User Recipients]
    U --> V[(MongoDB recipients Collection<br/>find by userId)]
    V --> W[Transform to CSV/Excel]
    W --> X[Generate Export Buffer]
    X --> Y[HTTP Response<br/>File Download]

    style D fill:#e1f5fe
    style I fill:#e1f5fe
    style M fill:#e1f5fe
    style R fill:#e1f5fe
    style V fill:#e1f5fe
```

## 6. AI Integration and Caching Data Flow

```mermaid
flowchart TD
    A[HTTP Request<br/>POST /api/describe-image] --> B[Image Controller<br/>Process Upload]
    B --> C[Generate Cache Key<br/>SHA256(image + prompt + model)]
    C --> D{Check Redis Cache}
    D -->|Hit| E[Return Cached Result]
    D -->|Miss| F[Ollama Service<br/>Process Image]
    F --> G[AI Model Processing<br/>qwen2.5vl:latest]
    G --> H[Parse JSON Response<br/>Extract Form Fields]
    H --> I[Cache Result in Redis<br/>TTL: 7 days]
    I --> J[Structure Form Fields]
    J --> K[HTTP Response<br/>Extracted Fields]
    
    %% Cache Performance Monitoring
    L[HTTP Request<br/>GET /api/cache/stats] --> M[Redis Cache Service<br/>Get Statistics]
    M --> N[Calculate Hit Rate<br/>+ Performance Metrics]
    N --> O[HTTP Response<br/>Cache Analytics]
    
    %% Form Field Processing
    P[Extracted Fields JSON] --> Q[Validate Field Structure]
    Q --> R[Convert to FormField Objects]
    R --> S[Add Field Configurations<br/>validation, styling]
    S --> T[Ready for Form Creation<br/>Save to MongoDB]
    
    %% OCR Result Caching Strategy
    U[Image Buffer + Prompt] --> V[Generate Fingerprint]
    V --> W{Fingerprint Exists<br/>in Redis?}
    W -->|Yes| X[Return Cached OCR]
    W -->|No| Y[Process with AI]
    Y --> Z[Cache New Result]
    Z --> AA[Return Fresh OCR]

    style D fill:#ffecb3
    style I fill:#ffecb3
    style W fill:#ffecb3
    style Z fill:#ffecb3
```

## 7. MongoDB Collection Relationships

```mermaid
erDiagram
    Users ||--o{ GeneratedForm : creates
    Users ||--o{ Recipients : owns
    Users ||--o{ RecipientGroups : manages
    Users ||--o{ FormSubmissions : submits
    
    GeneratedForm ||--o{ FormSubmissions : receives
    GeneratedForm ||--o{ PublicFormSubmissions : accepts
    GeneratedForm {
        ObjectId _id PK
        string userId FK
        FormField[] formData
        object metadata
        string pdfFingerprint
        string status
        Date createdAt
    }
    
    Users {
        ObjectId _id PK
        string username UK
        string email UK
        string fullName
        PasskeyCredential[] passkeys
        Date createdAt
    }
    
    FormSubmissions {
        ObjectId _id PK
        string formId FK
        object formData
        object userInfo
        object submissionMetadata
        Date createdAt
    }
    
    PublicFormSubmissions {
        ObjectId _id PK
        string formId FK
        object submissionData
        object userInfo
        Date submittedAt
    }
    
    Recipients {
        ObjectId _id PK
        string userId FK
        string name
        string email
        string phone
        Date createdAt
    }
    
    RecipientGroups {
        ObjectId _id PK
        string userId FK
        string aliasName
        ObjectId[] recipientIds FK
        Date createdAt
    }
    
    TokenBlacklist {
        ObjectId _id PK
        string token UK
        Date expiresAt
        Date createdAt
    }
```

## 8. Query Performance and Indexing Strategy

```mermaid
flowchart TD
    A[Query Performance Analysis] --> B[Collection Indexing Strategy]
    
    B --> C[Users Collection Indexes]
    C --> D[username: unique]
    C --> E[email: unique]
    C --> F[createdAt: -1]
    
    B --> G[GeneratedForm Collection Indexes]
    G --> H[metadata.createdBy.userId: 1,<br/>metadata.createdAt: -1]
    G --> I[pdfFingerprint: 1]
    G --> J[status: 1]
    
    B --> K[FormSubmissions Collection Indexes]
    K --> L[formId: 1,<br/>submissionMetadata.submittedAt: -1]
    K --> M[userInfo.userId: 1]
    
    B --> N[Recipients Collection Indexes]
    N --> O[userId: 1, email: 1]
    N --> P[createdAt: -1]
    
    Q[Common Query Patterns] --> R[User-Specific Data<br/>Filter by userId]
    Q --> S[Time-Based Queries<br/>Sort by createdAt/updatedAt]
    Q --> T[Search Operations<br/>Text/Regex patterns]
    Q --> U[Relationship Lookups<br/>Cross-collection joins]
    
    V[Performance Optimizations] --> W[Pagination Implementation<br/>skip() + limit()]
    V --> X[Compound Index Usage<br/>Multi-field queries]
    V --> Y[Redis Caching Layer<br/>7-day TTL for OCR]
    V --> Z[Aggregation Pipelines<br/>Complex data analysis]

    style C fill:#e8f5e8
    style G fill:#e8f5e8
    style K fill:#e8f5e8
    style N fill:#e8f5e8
```

## Key Data Flow Characteristics

### **Transaction Patterns**
- **Atomic Operations**: Single document operations are atomic
- **No Distributed Transactions**: Operations are designed to be independent
- **Eventual Consistency**: Cache invalidation with Redis integration

### **Error Handling Strategy**
- **Validation Errors**: Input validation before database operations
- **Constraint Violations**: Unique index conflicts handled gracefully
- **Reference Integrity**: Manual validation for cross-collection relationships
- **Timeout Handling**: Database connection timeout management

### **Performance Optimization**
- **Strategic Indexing**: Compound indexes for common query patterns  
- **Pagination**: Consistent skip/limit implementation across services
- **Caching Layer**: Redis integration for expensive AI operations
- **Query Optimization**: Aggregation pipelines for complex data analysis

### **Security Considerations**
- **User Isolation**: All queries filtered by user ownership
- **Input Sanitization**: MongoDB injection prevention
- **Authentication**: JWT token validation before database access
- **Role-Based Access**: Permission checks before data modifications