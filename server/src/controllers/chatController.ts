import { Request, Response } from 'express';
import { chatService, ChatMessage } from '../services/chatService';

export class ChatController {
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({
          error: 'Message is required and must be a non-empty string'
        });
        return;
      }

      // Trim message and check length
      const trimmedMessage = message.trim();
      if (trimmedMessage.length > 10000) {
        res.status(400).json({
          error: 'Message is too long. Maximum length is 10,000 characters.'
        });
        return;
      }

      console.log(`Chat request from user ${req.user?.userId}: "${trimmedMessage}"`);

      // Send message to chat service
      const response = await chatService.sendMessage(trimmedMessage);

      res.status(200).json({
        success: true,
        data: {
          message: response.message,
          timestamp: response.timestamp
        }
      });

    } catch (error: any) {
      console.error('Error in chat controller:', error);

      // Handle different types of errors
      if (error.status === 408) {
        res.status(408).json({
          error: 'Chat request timed out. Please try again.',
          details: error.message
        });
      } else if (error.status === 503) {
        res.status(503).json({
          error: 'Chat service is currently unavailable. Please try again later.',
          details: error.message
        });
      } else if (error.status && error.status >= 400 && error.status < 500) {
        res.status(error.status).json({
          error: error.message || 'Bad request to chat service'
        });
      } else {
        res.status(500).json({
          error: 'Internal server error occurred while processing chat request'
        });
      }
    }
  }

  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const isHealthy = await chatService.healthCheck();
      
      if (isHealthy) {
        res.status(200).json({
          success: true,
          message: 'Chat service is healthy',
          timestamp: new Date()
        });
      } else {
        res.status(503).json({
          error: 'Chat service is not responding',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error in chat health check:', error);
      res.status(500).json({
        error: 'Error checking chat service health',
        timestamp: new Date()
      });
    }
  }
}

export const chatController = new ChatController();
