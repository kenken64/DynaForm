import { config } from '../config';
import { OllamaGenerateResponse, OllamaError } from '../types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  message: string;
  timestamp: Date;
}

export class ChatService {
  private baseUrl: string;
  private modelName: string;

  constructor() {
    this.baseUrl = config.OLLAMA_BASE_URL;
    this.modelName = config.DEEPSEEK_MODEL_NAME;
  }

  /**
   * Filters out internal reasoning tags from AI model responses
   * Removes content between <think> and </think> tags, and other similar patterns
   */
  private filterInternalReasoningTags(content: string): string {
    if (!content) return content;

    // Remove <think>...</think> blocks (case insensitive, multiline)
    let filtered = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
    
    // Remove <thinking>...</thinking> blocks
    filtered = filtered.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    
    // Remove <reasoning>...</reasoning> blocks
    filtered = filtered.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
    
    // Remove <internal>...</internal> blocks
    filtered = filtered.replace(/<internal>[\s\S]*?<\/internal>/gi, '');
    
    // Clean up extra whitespace that might be left behind
    filtered = filtered.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
    
    return filtered;
  }

  /**
   * Send conversation to AI agent for potential interception and processing
   */
  private async sendToAIAgentInterceptor(prompt: string, response: string): Promise<void> {
    try {
      const aiAgentUrl = 'http://localhost:8001/intercept-conversation';
      
      const payload = {
        prompt: prompt,
        response: response
      };

      const interceptResponse = await fetch(aiAgentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        // Add a short timeout since this is non-critical
        signal: AbortSignal.timeout(5000)
      });

      if (interceptResponse.ok) {
        const result = await interceptResponse.json();
        if (result.action_taken) {
          console.log(`🤖 AI Agent detected and processed publishing request: ${result.message}`);
        } else {
          console.log(`🤖 AI Agent intercepted conversation but no action needed: ${result.message}`);
        }
      } else {
        console.warn(`AI Agent interception failed: ${interceptResponse.status} ${interceptResponse.statusText}`);
      }
    } catch (error: any) {
      // Log but don't throw - this is a non-critical feature
      console.warn('Failed to send conversation to AI agent interceptor:', error.message);
    }
  }

  async sendMessage(message: string): Promise<ChatResponse> {
    const payload = {
      model: this.modelName,
      prompt: message,
      stream: false,
    };

    console.log(`Sending chat request to Ollama. Model: ${this.modelName}. Message: "${message}"`);

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
        console.error(`Error from Ollama chat: ${response.status} ${response.statusText}`);
        console.error("Ollama Response body:", errorBody);
        
        const err = new Error(`Ollama chat request failed with status ${response.status}`) as OllamaError;
        err.ollamaError = errorBody;
        err.status = response.status;
        throw err;
      }

      const result = await response.json() as OllamaGenerateResponse;
      console.log("Ollama chat generation complete.");
      
      // Filter out internal reasoning tags before returning the response
      const filteredResponse = this.filterInternalReasoningTags(result.response);
      
      // Send conversation to AI agent interceptor for potential form publishing detection
      // This is done asynchronously and doesn't block the response
      this.sendToAIAgentInterceptor(message, filteredResponse).catch(err => {
        console.warn('AI agent interceptor call failed:', err.message);
      });
      
      return {
        message: filteredResponse,
        timestamp: new Date()
      };
    } catch (error: any) {
      // Enhanced error handling for different types of failures
      if (error.name === 'AbortError') {
        console.error(`Ollama chat request timed out after ${config.OLLAMA_TIMEOUT_MS}ms`);
        const timeoutError = new Error(`Chat request timed out after ${config.OLLAMA_TIMEOUT_MS / 1000} seconds.`) as OllamaError;
        timeoutError.status = 408; // Request Timeout
        timeoutError.ollamaError = 'Request timeout';
        throw timeoutError;
      } else if (error.code === 'UND_ERR_HEADERS_TIMEOUT') {
        console.error('Ollama headers timeout error');
        const headersTimeoutError = new Error('Connection to chat service timed out. Please ensure Ollama is running and responsive.') as OllamaError;
        headersTimeoutError.status = 408;
        headersTimeoutError.ollamaError = 'Headers timeout';
        throw headersTimeoutError;
      } else if (error.code === 'ECONNREFUSED') {
        console.error('Cannot connect to Ollama service');
        const connectionError = new Error('Cannot connect to chat service. Please ensure Ollama is running on the expected port.') as OllamaError;
        connectionError.status = 503; // Service Unavailable
        connectionError.ollamaError = 'Connection refused';
        throw connectionError;
      }
      
      console.error('Error calling Ollama chat service:', error);
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
      console.error('Ollama chat health check failed:', error);
      return false;
    }
  }
}

export const chatService = new ChatService();
