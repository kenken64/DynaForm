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
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.OLLAMA_TIMEOUT_MS);

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
    } catch (error: any) {
      // Enhanced error handling for different types of failures
      if (error.name === 'AbortError') {
        console.error(`Ollama request timed out after ${config.OLLAMA_TIMEOUT_MS}ms`);
        const timeoutError = new Error(`Ollama request timed out after ${config.OLLAMA_TIMEOUT_MS / 1000} seconds. The model may be processing a complex image.`) as OllamaError;
        timeoutError.status = 408; // Request Timeout
        timeoutError.ollamaError = 'Request timeout';
        throw timeoutError;
      } else if (error.code === 'UND_ERR_HEADERS_TIMEOUT') {
        console.error('Ollama headers timeout error');
        const headersTimeoutError = new Error('Connection to Ollama service timed out. Please ensure Ollama is running and responsive.') as OllamaError;
        headersTimeoutError.status = 408;
        headersTimeoutError.ollamaError = 'Headers timeout';
        throw headersTimeoutError;
      } else if (error.code === 'ECONNREFUSED') {
        console.error('Cannot connect to Ollama service');
        const connectionError = new Error('Cannot connect to Ollama service. Please ensure Ollama is running on the expected port.') as OllamaError;
        connectionError.status = 503; // Service Unavailable
        connectionError.ollamaError = 'Connection refused';
        throw connectionError;
      }
      
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
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.OLLAMA_TIMEOUT_MS);

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
    } catch (error: any) {
      // Enhanced error handling for different types of failures
      if (error.name === 'AbortError') {
        console.error(`Ollama text request timed out after ${config.OLLAMA_TIMEOUT_MS}ms`);
        const timeoutError = new Error(`Ollama text request timed out after ${config.OLLAMA_TIMEOUT_MS / 1000} seconds.`) as OllamaError;
        timeoutError.status = 408; // Request Timeout
        timeoutError.ollamaError = 'Request timeout';
        throw timeoutError;
      } else if (error.code === 'UND_ERR_HEADERS_TIMEOUT') {
        console.error('Ollama headers timeout error');
        const headersTimeoutError = new Error('Connection to Ollama service timed out. Please ensure Ollama is running and responsive.') as OllamaError;
        headersTimeoutError.status = 408;
        headersTimeoutError.ollamaError = 'Headers timeout';
        throw headersTimeoutError;
      } else if (error.code === 'ECONNREFUSED') {
        console.error('Cannot connect to Ollama service');
        const connectionError = new Error('Cannot connect to Ollama service. Please ensure Ollama is running on the expected port.') as OllamaError;
        connectionError.status = 503; // Service Unavailable
        connectionError.ollamaError = 'Connection refused';
        throw connectionError;
      }
      
      console.error('Error calling Ollama service:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }
}

export const ollamaService = new OllamaService();