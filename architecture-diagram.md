# DynaForm - Physical Architecture Diagram

```mermaid
graph TB
    %% User Layer
    subgraph "User Interface Layer"
        Web[🌐 Web Browser<br/>Port 4201]
        Mobile[📱 Mobile Browser]
    end

    %% Frontend Layer
    subgraph "Frontend Layer"
        Angular[🅰️ Angular Frontend<br/>Port 4201<br/>- Form Builder<br/>- Dashboard<br/>- Authentication]
        Nginx[🔧 Nginx Proxy<br/>- API Routing<br/>- Static Assets]
    end

    %% API Gateway Layer
    subgraph "API Gateway Layer"
        Express[🔧 Node.js/Express API<br/>Port 3000<br/>- REST Endpoints<br/>- Authentication<br/>- Business Logic]
    end

    %% Processing Layer
    subgraph "AI/Processing Layer"
        Ollama[🤖 Ollama AI Service<br/>Port 11434<br/>- qwen2.5vl Model<br/>- Form Field Extraction<br/>- Multimodal Analysis]
        
        Flask[📄 PDF Processing<br/>Port 5001<br/>- PDF to PNG Conversion<br/>- Image Processing<br/>- Metadata Extraction]
    end

    %% Data Layer
    subgraph "Data Persistence Layer"
        MongoDB[🗄️ MongoDB<br/>Port 27017<br/>- Forms Collection<br/>- Submissions Collection<br/>- Users Collection<br/>- Recipients Collection]
        
        Redis[⚡ Redis Cache<br/>Port 6379<br/>- Session Storage<br/>- API Caching<br/>- Performance Optimization]
    end

    %% Blockchain Layer
    subgraph "Blockchain Layer"
        Hardhat[🔗 Hardhat Framework<br/>- Smart Contract Development<br/>- Local Blockchain]
        
        Contract[📜 VerifiableURL Contract<br/>- Form Verification<br/>- Integrity Validation<br/>- Authenticity Proof]
        
        Web3[🌐 Web3 Provider<br/>- Blockchain Integration<br/>- Transaction Management]
    end

    %% External Services
    subgraph "External Services"
        Blockchain[🔗 Ethereum Network<br/>- Contract Deployment<br/>- Transaction Verification]
        
        IPFS[🗂️ IPFS (Optional)<br/>- Decentralized Storage<br/>- Document Hashing]
    end

    %% Docker Infrastructure
    subgraph "Infrastructure Layer"
        Docker[🐳 Docker Compose<br/>- Container Orchestration<br/>- Service Management<br/>- Volume Management]
        
        Volumes[💾 Docker Volumes<br/>- ollama_models<br/>- mongodb_data<br/>- redis_data]
    end

    %% Connections
    Web --> Angular
    Mobile --> Angular
    Angular --> Nginx
    Nginx --> Express
    
    Express --> Ollama
    Express --> Flask
    Express --> MongoDB
    Express --> Redis
    Express --> Web3
    
    Ollama --> Flask
    
    Web3 --> Contract
    Contract --> Hardhat
    Hardhat --> Blockchain
    
    MongoDB --> Volumes
    Redis --> Volumes
    Ollama --> Volumes
    
    Docker --> Angular
    Docker --> Express
    Docker --> Ollama
    Docker --> Flask
    Docker --> MongoDB
    Docker --> Redis

    %% Styling
    classDef frontend fill:#e1f5fe
    classDef backend fill:#f3e5f5
    classDef ai fill:#e8f5e8
    classDef data fill:#fff3e0
    classDef blockchain fill:#fce4ec
    classDef infra fill:#f5f5f5

    class Angular,Nginx frontend
    class Express backend
    class Ollama,Flask ai
    class MongoDB,Redis data
    class Hardhat,Contract,Web3,Blockchain,IPFS blockchain
    class Docker,Volumes infra
```

## Component Details

### Frontend Layer (Port 4201)
- **Angular Application**: SPA with form builder, dashboard, and user management
- **Nginx Proxy**: Routes API calls and serves static assets

### Backend Layer (Port 3000)
- **Express API**: RESTful endpoints for form management, user auth, and data operations
- **Middleware**: Authentication, file upload, caching, and error handling

### AI/Processing Layer
- **Ollama Service (Port 11434)**: Multimodal AI for form field extraction
- **PDF Processing (Port 5001)**: Flask service for PDF-to-image conversion

### Data Layer
- **MongoDB (Port 27017)**: Primary database for forms, submissions, and users
- **Redis (Port 6379)**: Caching layer for performance optimization

### Blockchain Layer
- **Smart Contracts**: Verifiable URL contracts for form integrity
- **Web3 Integration**: Blockchain verification and transaction management
- **Hardhat Framework**: Development and deployment tools

### Infrastructure
- **Docker Compose**: Orchestrates all services with proper networking
- **Persistent Volumes**: Data persistence across container restarts
- **Cross-Platform Scripts**: Windows PowerShell and Mac/Linux Bash support

## Data Flow

1. **Document Upload**: User uploads PDF → Flask processes → Images generated
2. **AI Analysis**: Images sent to Ollama → Form fields extracted → JSON schema created
3. **Form Creation**: Schema stored in MongoDB → Form builder populated
4. **Form Sharing**: Public forms accessible → Data collection begins
5. **Blockchain Verification**: Form integrity verified → Smart contract validation
6. **Data Export**: Submissions aggregated → Excel export generated

## Security Features

- **Authentication**: JWT-based user authentication
- **Database Security**: MongoDB with role-based access and Docker secrets
- **Blockchain Verification**: Smart contract-based form authenticity
- **API Security**: Rate limiting, input validation, and CORS protection
- **Container Security**: Isolated services with minimal privileges