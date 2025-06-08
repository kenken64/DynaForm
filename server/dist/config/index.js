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
    let password;
    // Try to get password from MONGODB_PASSWORD_FILE first (Docker Compose secret)
    if (process.env.MONGODB_PASSWORD_FILE) {
        try {
            password = (0, fs_1.readFileSync)(process.env.MONGODB_PASSWORD_FILE, 'utf8').trim();
            console.log('🔐 Using MongoDB password from Docker secret file');
        }
        catch (error) {
            console.warn(`Could not read password from file ${process.env.MONGODB_PASSWORD_FILE}:`, error);
            // Fall back to Docker secret method
            const passwordFromSecret = readDockerSecret('mongodb_app_password');
            password = passwordFromSecret || process.env.MONGODB_PASSWORD || 'apppassword123';
            if (passwordFromSecret) {
                console.log('🔐 Using MongoDB password from Docker secret (fallback)');
            }
            else if (process.env.MONGODB_PASSWORD) {
                console.log('⚠️  Using MongoDB password from environment variable (fallback)');
            }
            else {
                console.log('⚠️  Using default MongoDB password - change in production! (fallback)');
            }
        }
    }
    else {
        // Fall back to original method: Docker secret, then environment variable, then default
        const passwordFromSecret = readDockerSecret('mongodb_app_password');
        password = passwordFromSecret || process.env.MONGODB_PASSWORD || 'apppassword123';
        if (passwordFromSecret) {
            console.log('🔐 Using MongoDB password from Docker secret');
        }
        else if (process.env.MONGODB_PASSWORD) {
            console.log('⚠️  Using MongoDB password from environment variable');
        }
        else {
            console.log('⚠️  Using default MongoDB password - change in production!');
        }
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
    // JWT Configuration
    get JWT_SECRET() {
        return process.env.JWT_SECRET || 'demo-secret-key-change-in-production';
    },
    get JWT_REFRESH_SECRET() {
        return process.env.JWT_REFRESH_SECRET || 'demo-refresh-secret-key-change-in-production';
    },
    get JWT_EXPIRES_IN() {
        return process.env.JWT_EXPIRES_IN || '24h';
    },
    get JWT_REFRESH_EXPIRES_IN() {
        return process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    },
    // Redis Configuration
    get REDIS_HOST() {
        return process.env.REDIS_HOST || 'localhost';
    },
    get REDIS_PORT() {
        return parseInt(process.env.REDIS_PORT || '6379', 10);
    },
    get REDIS_PASSWORD() {
        return process.env.REDIS_PASSWORD || undefined;
    },
    get REDIS_DB() {
        return parseInt(process.env.REDIS_DB || '0', 10);
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
    // Ollama Configuration (via AI Agent Proxy for conversation interception)
    get OLLAMA_BASE_URL() {
        return process.env.OLLAMA_BASE_URL || 'http://localhost:11435';
    },
    get DEFAULT_MODEL_NAME() {
        return process.env.DEFAULT_QWEN_MODEL_NAME || 'qwen2.5vl:latest';
    },
    get DEEPSEEK_MODEL_NAME() {
        return process.env.DEEPSEEK_MODEL_NAME || 'deepseek-r1:8b';
    },
    // Ollama Timeout Configuration
    get OLLAMA_TIMEOUT_MS() {
        return parseInt(process.env.OLLAMA_TIMEOUT_MS || '180000', 10); // Default 3 minutes, configurable via env
    },
    get OLLAMA_KEEP_ALIVE() {
        return process.env.OLLAMA_KEEP_ALIVE || '5m';
    },
    // File Upload Configuration
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    JSON_LIMIT: '50mb',
    // API Configuration
    API_VERSION: '1.0.0',
    SERVICE_NAME: 'doc2formjson-api'
};
exports.default = exports.config;
//# sourceMappingURL=index.js.map