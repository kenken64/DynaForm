import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # MongoDB Configuration
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://doc2formapp:apppassword123@localhost:27017/doc2formjson?authSource=admin')
    MONGODB_DATABASE = os.getenv('MONGODB_DATABASE', 'doc2formjson')
    FORMS_COLLECTION = os.getenv('FORMS_COLLECTION', 'generated_form')
    
    # Ollama Configuration
    OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
    OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.2:3b')
    OLLAMA_TIMEOUT = int(os.getenv('OLLAMA_TIMEOUT', 300))  # Default 5 minutes
    OLLAMA_KEEP_ALIVE = os.getenv('OLLAMA_KEEP_ALIVE', '5m')
    
    # API Endpoints
    VERIFIABLE_CONTRACT_API = os.getenv('VERIFIABLE_CONTRACT_API', 'http://localhost:3002/api/urls')
    FRONTEND_BASE_URL = os.getenv('FRONTEND_BASE_URL', 'http://localhost:4200')
    
    # Agent Configuration
    LISTEN_KEYWORDS = ['publish', 'deploy', 'register']
    
    # Server Configuration
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 8001))

config = Config()