import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Application Configuration
  get NODE_ENV() { return process.env.NODE_ENV || 'development'; },
  get PORT() { return parseInt(process.env.PORT || '3000', 10); },
  
  // MongoDB Configuration
  get MONGODB_URI() { return process.env.MONGODB_URI || 'mongodb://localhost:27017'; },
  get MONGODB_DB_NAME() { return process.env.MONGODB_DB_NAME || 'doc2formjson'; },
  
  // Ollama Configuration
  get OLLAMA_BASE_URL() { return process.env.OLLAMA_BASE_URL || 'http://localhost:11434'; },
  get DEFAULT_MODEL_NAME() { return process.env.DEFAULT_QWEN_MODEL_NAME || 'qwen:7b'; },
  
  // File Upload Configuration
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  JSON_LIMIT: '50mb',
  
  // API Configuration
  API_VERSION: '1.0.0',
  SERVICE_NAME: 'doc2formjson-api'
} as const;

export default config;