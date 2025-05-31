"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ollamaService = exports.OllamaService = void 0;
const config_1 = require("../config");
class OllamaService {
    constructor() {
        this.baseUrl = config_1.config.OLLAMA_BASE_URL;
    }
    async generateWithImage(imageBase64, prompt, modelName = config_1.config.DEFAULT_MODEL_NAME) {
        const payload = {
            model: modelName,
            prompt: prompt,
            images: [imageBase64],
            stream: false,
        };
        console.log(`Sending request to Ollama. Model: ${modelName}. Prompt: "${prompt}". Image: (provided)`);
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Error from Ollama: ${response.status} ${response.statusText}`);
                console.error("Ollama Response body:", errorBody);
                const err = new Error(`Ollama request failed with status ${response.status}`);
                err.ollamaError = errorBody;
                err.status = response.status;
                throw err;
            }
            const result = await response.json();
            console.log("Ollama generation complete.");
            return result;
        }
        catch (error) {
            console.error('Error calling Ollama service:', error);
            throw error;
        }
    }
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        }
        catch (error) {
            console.error('Ollama health check failed:', error);
            return false;
        }
    }
}
exports.OllamaService = OllamaService;
exports.ollamaService = new OllamaService();
//# sourceMappingURL=ollamaService.js.map