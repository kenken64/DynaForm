// Minimal test to isolate the issue
import { Request, Response } from 'express';
import { ImageController } from '../../../src/controllers/imageController';
import { ollamaService } from '../../../src/services';

// Mock the services
jest.mock('../../../src/services');

describe('ImageController Test', () => {
  it('should be a basic test', () => {
    expect(true).toBe(true);
  });
});
