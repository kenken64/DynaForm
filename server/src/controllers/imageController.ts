import { Request, Response } from 'express';
import { ollamaService } from '../services';
import { OllamaError } from '../types';
import { config } from '../config';

export class ImageController {
  async describeImage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ 
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

      const ollamaResult = await ollamaService.generateWithImage(imageBase64, prompt, model);

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

    } catch (error: any) {
      console.error('Error processing image description request:', error);
      const typedError = error as OllamaError;
      
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

  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const isHealthy = await ollamaService.healthCheck();
      
      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: config.SERVICE_NAME,
        version: config.API_VERSION,
        ollama: {
          baseUrl: config.OLLAMA_BASE_URL,
          defaultModel: config.DEFAULT_MODEL_NAME,
          accessible: isHealthy
        }
      });
    } catch (error: any) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: config.SERVICE_NAME,
        version: config.API_VERSION,
        error: error.message
      });
    }
  }

  async summarizeText(req: Request, res: Response): Promise<void> {
    try {
      const { text, model } = req.body;

      if (!text) {
        res.status(400).json({ 
          error: 'Text is required for summarization' 
        });
        return;
      }

      const selectedModel: string = model || config.DEFAULT_MODEL_NAME;
      const prompt = `Summarize the following text: ${text}`;

      console.log(`Received request for text summarization with model: ${selectedModel}`);

      const ollamaResult = await ollamaService.generate(prompt, selectedModel);

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

    } catch (error: any) {
      if (error.ollamaError) {
        res.status(error.status || 500).json({
          error: 'Failed to get summary from Ollama.',
          ollamaDetails: error.ollamaError,
          message: error.message
        });
      } else {
        res.status(500).json({
          error: 'Internal server error.',
          message: error.message
        });
      }
    }
  }
}

export const imageController = new ImageController();