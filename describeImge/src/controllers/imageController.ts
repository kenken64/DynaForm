import { Request, Response } from 'express';
import { OllamaService } from '../services';
import config from '../config';

export class ImageController {
    private ollamaService: OllamaService;

    constructor() {
        this.ollamaService = new OllamaService();
    }

    async describeImage(req: Request, res: Response): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({ 
                    success: false,
                    error: 'No image file uploaded. Please include a file with the key "imageFile".' 
                });
                return;
            }

            const prompt: string = (req.body.prompt as string) || "Describe this image in detail.";
            const model: string = (req.body.model as string) || config.DEFAULT_MODEL_NAME;

            console.log(`Received request for model: ${model}, prompt: "${prompt}"`);
            if (model === 'qwen:7b' && model === config.DEFAULT_MODEL_NAME) {
                console.warn("⚠️ WARNING: You might be using a placeholder model name...");
            }

            const imageBuffer: Buffer = req.file.buffer;
            const imageBase64: string = imageBuffer.toString('base64');

            const ollamaResult = await this.ollamaService.generateWithImage(imageBase64, prompt, model);

            res.json({
                success: true,
                data: {
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
                }
            });

        } catch (error: any) {
            console.error('Error processing image description request:', error);
            
            if (error.ollamaError) {
                res.status(error.status || 500).json({
                    success: false,
                    error: 'Failed to get description from Ollama.',
                    ollamaDetails: error.ollamaError,
                    message: error.message
                });
                return;
            }
            
            res.status(500).json({ 
                success: false,
                error: 'Internal server error.', 
                message: error.message 
            });
        }
    }

    async healthCheck(req: Request, res: Response): Promise<void> {
        try {
            // Check if Ollama service is available
            const isOllamaAvailable = await this.ollamaService.checkModelAvailability(config.DEFAULT_MODEL_NAME);
            
            res.status(200).json({
                success: true,
                data: {
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    service: 'doc2formjson-api',
                    version: '1.0.0',
                    ollama: {
                        baseUrl: config.OLLAMA_BASE_URL,
                        defaultModel: config.DEFAULT_MODEL_NAME,
                        available: isOllamaAvailable
                    }
                }
            });
        } catch (error: any) {
            res.status(503).json({
                success: false,
                error: 'Service unavailable',
                message: error.message
            });
        }
    }
}
