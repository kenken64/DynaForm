"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
exports.config = {
    // Application Configuration
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    // MongoDB Configuration
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'doc2formjson',
    // Ollama Configuration
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    DEFAULT_MODEL_NAME: process.env.DEFAULT_QWEN_MODEL_NAME || 'qwen:7b',
    // Server Configuration
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    JSON_LIMIT: '50mb',
    // API Configuration
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100
};
exports.default = exports.config;
//# sourceMappingURL=index.js.map