import { config } from '../config';
import { OllamaGenerateResponse, OllamaError } from '../types';

export class OllamaService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.OLLAMA_BASE_URL;
  }

  async generateWithImage(
    imageBase64: string,
    prompt: string,
    modelName: string = config.DEFAULT_MODEL_NAME
  ): Promise<OllamaGenerateResponse> {
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
        
        const err = new Error(`Ollama request failed with status ${response.status}`) as OllamaError;
        err.ollamaError = errorBody;
        err.status = response.status;
        throw err;
      }

      const result = await response.json() as OllamaGenerateResponse;
      console.log("Ollama generation complete.");
      return result;
    } catch (error) {
      console.error('Error calling Ollama service:', error);
      throw error;
    }
  }

  async generate(
    prompt: string,
    modelName: string = config.DEFAULT_MODEL_NAME
  ): Promise<OllamaGenerateResponse> {
    const payload = {
      model: modelName,
      prompt: prompt,
      stream: false,
    };

    console.log(`Sending text request to Ollama. Model: ${modelName}. Prompt: "${prompt}"`);

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
        
        const err = new Error(`Ollama request failed with status ${response.status}`) as OllamaError;
        err.ollamaError = errorBody;
        err.status = response.status;
        throw err;
      }

      const result = await response.json() as OllamaGenerateResponse;
      console.log("Ollama text generation complete.");
      return result;
    } catch (error) {
      console.error('Error calling Ollama service:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }
}

export const ollamaService = new OllamaService();