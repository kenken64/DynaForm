"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
exports.config = {
    // Application Configuration
    get NODE_ENV() { return process.env.NODE_ENV || 'development'; },
    get PORT() { return parseInt(process.env.PORT || '3000', 10); },
    // MongoDB Configuration
    get MONGODB_URI() { return process.env.MONGODB_URI || 'mongodb://localhost:27017'; },
    get MONGODB_DB_NAME() { return process.env.MONGODB_DB_NAME || 'doc2formjson'; },
    // Ollama Configuration
    get OLLAMA_BASE_URL() { return process.env.OLLAMA_BASE_URL || 'http://localhost:11434'; },
    get DEFAULT_MODEL_NAME() { return process.env.DEFAULT_QWEN_MODEL_NAME || 'qwen2.5vl:latest'; },
    // Ollama Timeout Configuration
    OLLAMA_TIMEOUT_MS: 120000, // 2 minutes timeout for image processing
    // File Upload Configuration
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    JSON_LIMIT: '50mb',
    // API Configuration
    API_VERSION: '1.0.0',
    SERVICE_NAME: 'doc2formjson-api'
};
exports.default = exports.config;
//# sourceMappingURL=index.js.map