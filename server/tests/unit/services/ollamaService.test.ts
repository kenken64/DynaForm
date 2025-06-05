// Unit tests for OllamaService
import { OllamaService } from '../../../src/services/ollamaService';
import { config } from '../../../src/config';
import { OllamaGenerateResponse } from '../../../src/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('OllamaService', () => {
  let ollamaService: OllamaService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    ollamaService = new OllamaService();
    jest.clearAllMocks();
  });

  describe('generateWithImage', () => {
    const mockImageBase64 = 'base64imagedata';
    const mockPrompt = 'Describe this image';
    const mockModel = 'test-model';

    const mockSuccessResponse: OllamaGenerateResponse = {
      model: mockModel,
      created_at: '2024-01-01T00:00:00Z',
      response: 'This is a test response',
      done: true,
      total_duration: 1000,
      load_duration: 100,
      prompt_eval_count: 10,
      prompt_eval_duration: 200,
      eval_count: 50,
      eval_duration: 700
    };

    it('should successfully generate response with image', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockSuccessResponse)
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await ollamaService.generateWithImage(
        mockImageBase64,
        mockPrompt,
        mockModel
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `${config.OLLAMA_BASE_URL}/api/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: mockModel,
            prompt: mockPrompt,
            images: [mockImageBase64],
            stream: false,
          })
        }
      );

      expect(result).toEqual(mockSuccessResponse);
    });

    it('should use default model when none provided', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockSuccessResponse)
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await ollamaService.generateWithImage(mockImageBase64, mockPrompt);

      expect(mockFetch).toHaveBeenCalledWith(
        `${config.OLLAMA_BASE_URL}/api/generate`,
        expect.objectContaining({
          body: expect.stringContaining(`"model":"${config.DEFAULT_MODEL_NAME}"`)
        })
      );
    });

    it('should handle Ollama API errors', async () => {
      const errorBody = 'Ollama service error';
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue(errorBody)
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(
        ollamaService.generateWithImage(mockImageBase64, mockPrompt, mockModel)
      ).rejects.toThrow('Ollama request failed with status 500');

      expect(mockResponse.text).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      await expect(
        ollamaService.generateWithImage(mockImageBase64, mockPrompt, mockModel)
      ).rejects.toThrow('Network error');
    });

    it('should handle invalid JSON responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(
        ollamaService.generateWithImage(mockImageBase64, mockPrompt, mockModel)
      ).rejects.toThrow('Invalid JSON');
    });
  });

  describe('healthCheck', () => {
    it('should return true for successful health check', async () => {
      const mockResponse = {
        ok: true,
        status: 200
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await ollamaService.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith(`${config.OLLAMA_BASE_URL}/api/tags`);
      expect(result).toBe(true);
    });

    it('should return false for failed health check', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await ollamaService.healthCheck();
      expect(result).toBe(false);
    });
  });
});
