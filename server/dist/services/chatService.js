"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = exports.ChatService = void 0;
const config_1 = require("../config");
class ChatService {
    constructor() {
        this.baseUrl = config_1.config.OLLAMA_BASE_URL;
        this.modelName = config_1.config.DEEPSEEK_MODEL_NAME;
    }
    async sendMessage(message) {
        const payload = {
            model: this.modelName,
            prompt: message,
            stream: false,
        };
        console.log(`Sending chat request to Ollama. Model: ${this.modelName}. Message: "${message}"`);
        try {
            // Create AbortController for timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config_1.config.OLLAMA_TIMEOUT_MS);
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            // Clear timeout if request completes successfully
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Error from Ollama chat: ${response.status} ${response.statusText}`);
                console.error("Ollama Response body:", errorBody);
                const err = new Error(`Ollama chat request failed with status ${response.status}`);
                err.ollamaError = errorBody;
                err.status = response.status;
                throw err;
            }
            const result = await response.json();
            console.log("Ollama chat generation complete.");
            return {
                message: result.response,
                timestamp: new Date()
            };
        }
        catch (error) {
            // Enhanced error handling for different types of failures
            if (error.name === 'AbortError') {
                console.error(`Ollama chat request timed out after ${config_1.config.OLLAMA_TIMEOUT_MS}ms`);
                const timeoutError = new Error(`Chat request timed out after ${config_1.config.OLLAMA_TIMEOUT_MS / 1000} seconds.`);
                timeoutError.status = 408; // Request Timeout
                timeoutError.ollamaError = 'Request timeout';
                throw timeoutError;
            }
            else if (error.code === 'UND_ERR_HEADERS_TIMEOUT') {
                console.error('Ollama headers timeout error');
                const headersTimeoutError = new Error('Connection to chat service timed out. Please ensure Ollama is running and responsive.');
                headersTimeoutError.status = 408;
                headersTimeoutError.ollamaError = 'Headers timeout';
                throw headersTimeoutError;
            }
            else if (error.code === 'ECONNREFUSED') {
                console.error('Cannot connect to Ollama service');
                const connectionError = new Error('Cannot connect to chat service. Please ensure Ollama is running on the expected port.');
                connectionError.status = 503; // Service Unavailable
                connectionError.ollamaError = 'Connection refused';
                throw connectionError;
            }
            console.error('Error calling Ollama chat service:', error);
            throw error;
        }
    }
    async healthCheck() {
        try {
            // Create AbortController for timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response.ok;
        }
        catch (error) {
            console.error('Ollama chat health check failed:', error);
            return false;
        }
    }
}
exports.ChatService = ChatService;
exports.chatService = new ChatService();
//# sourceMappingURL=chatService.js.map