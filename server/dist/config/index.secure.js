"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = require("fs");
// Load environment variables
dotenv_1.default.config();
// Helper function to read Docker secrets
function readDockerSecret(secretName) {
    try {
        const secretPath = `/run/secrets/${secretName}`;
        if ((0, fs_1.existsSync)(secretPath)) {
            return (0, fs_1.readFileSync)(secretPath, 'utf8').trim();
        }
    }
    catch (error) {
        console.warn(`Could not read Docker secret ${secretName}:`, error);
    }
    return null;
}
// Helper function to construct MongoDB URI with secure password handling
function buildMongoDBURI() {
    const host = process.env.MONGODB_HOST || 'localhost';
    const port = process.env.MONGODB_PORT || '27017';
    const database = process.env.MONGODB_DATABASE || 'doc2formjson';
    const username = process.env.MONGODB_USERNAME || 'doc2formapp';
    // Try to get password from Docker secret first, then environment variable
    const passwordFromSecret = readDockerSecret('mongodb_app_password');
    const password = passwordFromSecret || process.env.MONGODB_PASSWORD || 'apppassword123';
    if (passwordFromSecret) {
        console.log('🔐 Using MongoDB password from Docker secret');
    }
    else if (process.env.MONGODB_PASSWORD) {
        console.log('⚠️  Using MongoDB password from environment variable');
    }
    else {
        console.log('⚠️  Using default MongoDB password - change in production!');
    }
    return `mongodb://${username}:${password}@${host}:${port}/${database}`;
}
exports.config = {
    // Application Configuration
    get NODE_ENV() {
        return process.env.NODE_ENV || 'development';
    },
    get PORT() {
        return parseInt(process.env.PORT || '3000', 10);
    },
    // MongoDB Configuration with secure password handling
    get MONGODB_URI() {
        // Check if full URI is provided (backward compatibility)
        if (process.env.MONGODB_URI && !process.env.MONGODB_PASSWORD_FILE) {
            return process.env.MONGODB_URI;
        }
        // Build URI with secure password management
        return buildMongoDBURI();
    },
    get MONGODB_DB_NAME() {
        return process.env.MONGODB_DATABASE || process.env.MONGODB_DB_NAME || 'doc2formjson';
    },
    // Ollama Configuration
    get OLLAMA_BASE_URL() {
        return process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    },
    get DEFAULT_MODEL_NAME() {
        return process.env.DEFAULT_QWEN_MODEL_NAME || 'qwen2.5vl:latest';
    },
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
//# sourceMappingURL=index.secure.js.map