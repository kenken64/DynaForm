"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageController = exports.ImageController = void 0;
const services_1 = require("../services");
const redisCacheService_1 = require("../services/redisCacheService");
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
            // Check if this is a form analysis request (OCR)
            const isFormAnalysis = prompt.toLowerCase().includes('form') ||
                prompt.toLowerCase().includes('field') ||
                prompt.toLowerCase().includes('json');
            let ollamaResult;
            let cacheHit = false;
            if (isFormAnalysis) {
                // Generate fingerprint for caching
                const jsonFingerprint = redisCacheService_1.redisCacheService.generateJsonFingerprint(imageBuffer, prompt);
                console.log(`🔍 Generated fingerprint for OCR request: ${jsonFingerprint}`);
                // Check cache first
                const cachedResult = await redisCacheService_1.redisCacheService.getCachedOcrResult(jsonFingerprint);
                if (cachedResult) {
                    console.log(`✅ Using cached OCR result for fingerprint: ${jsonFingerprint}`);
                    cacheHit = true;
                    // Return cached result in the same format as Ollama response
                    res.json({
                        description: `\`\`\`json
${JSON.stringify({
                            forms: [{
                                    title: cachedResult.formTitle,
                                    fields: cachedResult.fields
                                }]
                        }, null, 2)}
\`\`\``,
                        modelUsed: model,
                        createdAt: new Date().toISOString(),
                        cached: true,
                        cacheTimestamp: cachedResult.cachedAt,
                        timings: {
                            totalDuration: 0,
                            promptEvalDuration: 0,
                            evalDuration: 0,
                        },
                        tokenCounts: {
                            promptEvalCount: 0,
                            evalCount: 0,
                        }
                    });
                    return;
                }
                // If not in cache, proceed with Ollama call
                console.log(`🔄 Cache miss, proceeding with Ollama call for fingerprint: ${jsonFingerprint}`);
                ollamaResult = await services_1.ollamaService.generateWithImage(imageBase64, prompt, model);
                // Parse and cache the result for future use
                try {
                    const jsonMatch = ollamaResult.response.match(/```json\s*([\s\S]*?)```/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[1]);
                        if (parsed.forms && parsed.forms[0]) {
                            const formData = parsed.forms[0];
                            await redisCacheService_1.redisCacheService.cacheOcrResult(jsonFingerprint, formData.title || null, formData.fields || [], parsed);
                            console.log(`💾 Cached OCR result for future use: ${jsonFingerprint}`);
                        }
                    }
                }
                catch (parseError) {
                    console.warn(`⚠️ Could not parse OCR result for caching: ${parseError}`);
                }
            }
            else {
                // For non-form requests, proceed directly with Ollama
                ollamaResult = await services_1.ollamaService.generateWithImage(imageBase64, prompt, model);
            }
            res.json({
                description: ollamaResult.response,
                modelUsed: ollamaResult.model,
                createdAt: ollamaResult.created_at,
                cached: cacheHit,
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
            const cacheHealth = await redisCacheService_1.redisCacheService.healthCheck();
            res.status((isHealthy && cacheHealth) ? 200 : 503).json({
                status: (isHealthy && cacheHealth) ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                service: config_1.config.SERVICE_NAME,
                version: config_1.config.API_VERSION,
                ollama: {
                    baseUrl: config_1.config.OLLAMA_BASE_URL,
                    defaultModel: config_1.config.DEFAULT_MODEL_NAME,
                    accessible: isHealthy
                },
                cache: {
                    accessible: cacheHealth,
                    stats: cacheHealth ? await redisCacheService_1.redisCacheService.getCacheStats() : null
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
    async getCacheStats(req, res) {
        try {
            const stats = await redisCacheService_1.redisCacheService.getCacheStats();
            res.json({
                status: 'success',
                timestamp: new Date().toISOString(),
                cache: stats
            });
        }
        catch (error) {
            res.status(500).json({
                status: 'error',
                timestamp: new Date().toISOString(),
                error: error.message
            });
        }
    }
    async clearCache(req, res) {
        try {
            const clearedCount = await redisCacheService_1.redisCacheService.clearOcrCache();
            res.json({
                status: 'success',
                timestamp: new Date().toISOString(),
                message: `Cleared ${clearedCount} cache entries`,
                clearedCount
            });
        }
        catch (error) {
            res.status(500).json({
                status: 'error',
                timestamp: new Date().toISOString(),
                error: error.message
            });
        }
    }
}
exports.ImageController = ImageController;
exports.imageController = new ImageController();
//# sourceMappingURL=imageControllerWithCache.js.map