"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageController = exports.ImageController = void 0;
const services_1 = require("../services");
const config_1 = require("../config");
class ImageController {
    async describeImage(req, res) {
        try {
            if (!req.file) {
                res.status(400).json({
                    error: 'No image file uploaded. Please include a file with the key "imageFile".'
                });
                return;
            }
            const prompt = req.body.prompt || "Describe this image in detail.";
            const model = req.body.model || config_1.config.DEFAULT_MODEL_NAME;
            console.log(`Received request for model: ${model}, prompt: "${prompt}"`);
            if (model === 'qwen:7b' && model === config_1.config.DEFAULT_MODEL_NAME) {
                console.warn("⚠️ WARNING: You might be using a placeholder model name...");
            }
            const imageBuffer = req.file.buffer;
            const imageBase64 = imageBuffer.toString('base64');
            const ollamaResult = await services_1.ollamaService.generateWithImage(imageBase64, prompt, model);
            res.json({
                description: ollamaResult.response,
                modelUsed: ollamaResult.model,
                createdAt: ollamaResult.created_at,
                timings: {
                    totalDuration: ollamaResult.total_duration,
                    promptEvalDuration: ollamaResult.prompt_eval_duration,
                    evalDuration: ollamaResult.eval_duration,
                },
                tokenCounts: {
                    promptEvalCount: ollamaResult.prompt_eval_count,
                    evalCount: ollamaResult.eval_count,
                }
            });
        }
        catch (error) {
            console.error('Error processing image description request:', error);
            const typedError = error;
            if (typedError.ollamaError) {
                res.status(typedError.status || 500).json({
                    error: 'Failed to get description from Ollama.',
                    ollamaDetails: typedError.ollamaError,
                    message: typedError.message
                });
                return;
            }
            res.status(500).json({
                error: 'Internal server error.',
                message: error.message
            });
        }
    }
    async healthCheck(req, res) {
        try {
            const isHealthy = await services_1.ollamaService.healthCheck();
            res.status(isHealthy ? 200 : 503).json({
                status: isHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                service: config_1.config.SERVICE_NAME,
                version: config_1.config.API_VERSION,
                ollama: {
                    baseUrl: config_1.config.OLLAMA_BASE_URL,
                    defaultModel: config_1.config.DEFAULT_MODEL_NAME,
                    accessible: isHealthy
                }
            });
        }
        catch (error) {
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                service: config_1.config.SERVICE_NAME,
                version: config_1.config.API_VERSION,
                error: error.message
            });
        }
    }
    async summarizeText(req, res) {
        try {
            const { text, model } = req.body;
            if (!text) {
                res.status(400).json({
                    error: 'Text is required for summarization'
                });
                return;
            }
            const selectedModel = model || config_1.config.DEFAULT_MODEL_NAME;
            const prompt = `Summarize the following text: ${text}`;
            console.log(`Received request for text summarization with model: ${selectedModel}`);
            const ollamaResult = await services_1.ollamaService.generate(prompt, selectedModel);
            res.json({
                summary: ollamaResult.response,
                modelUsed: ollamaResult.model,
                createdAt: ollamaResult.created_at,
                timings: {
                    totalDuration: ollamaResult.total_duration,
                    promptEvalDuration: ollamaResult.prompt_eval_duration,
                    evalDuration: ollamaResult.eval_duration,
                },
                tokenCounts: {
                    promptEvalCount: ollamaResult.prompt_eval_count,
                    evalCount: ollamaResult.eval_count,
                }
            });
        }
        catch (error) {
            if (error.ollamaError) {
                res.status(error.status || 500).json({
                    error: 'Failed to get summary from Ollama.',
                    ollamaDetails: error.ollamaError,
                    message: error.message
                });
            }
            else {
                res.status(500).json({
                    error: 'Internal server error.',
                    message: error.message
                });
            }
        }
    }
}
exports.ImageController = ImageController;
exports.imageController = new ImageController();
//# sourceMappingURL=imageController.js.map