// Integration tests for API endpoints
import request from 'supertest';
import { Application } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { createApp } from '../../src/app';
import { connectToMongoDB, closeConnection } from '../../src/database/connection';

// Mock the Ollama service for integration tests
jest.mock('../../src/services/ollamaService', () => ({
  OllamaService: jest.fn().mockImplementation(() => ({
    generateWithImage: jest.fn().mockResolvedValue({
      model: 'test-model',
      created_at: '2024-01-01T00:00:00Z',
      response: 'Test image description',
      done: true,
      total_duration: 1000,
      prompt_eval_duration: 200,
      eval_duration: 700,
      prompt_eval_count: 10,
      eval_count: 50
    }),
    generate: jest.fn().mockResolvedValue({
      model: 'test-model',
      created_at: '2024-01-01T00:00:00Z',
      response: 'Test summary',
      done: true,
      total_duration: 800,
      prompt_eval_duration: 150,
      eval_duration: 600,
      prompt_eval_count: 15,
      eval_count: 30
    }),
    healthCheck: jest.fn().mockResolvedValue(true)
  })),
  ollamaService: {
    generateWithImage: jest.fn().mockResolvedValue({
      model: 'test-model',
      created_at: '2024-01-01T00:00:00Z',
      response: 'Test image description',
      done: true,
      total_duration: 1000,
      prompt_eval_duration: 200,
      eval_duration: 700,
      prompt_eval_count: 10,
      eval_count: 50
    }),
    generate: jest.fn().mockResolvedValue({
      model: 'test-model',
      created_at: '2024-01-01T00:00:00Z',
      response: 'Test summary',
      done: true,
      total_duration: 800,
      prompt_eval_duration: 150,
      eval_duration: 600,
      prompt_eval_count: 15,
      eval_count: 30
    }),
    healthCheck: jest.fn().mockResolvedValue(true)
  }
}));

describe('API Integration Tests', () => {
  let app: Application;
  let mongoServer: MongoMemoryServer;
  let mongoClient: MongoClient;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Set test environment variables BEFORE importing any modules that use config
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = mongoUri;
    process.env.MONGODB_DB_NAME = 'test-doc2formjson';
    process.env.PORT = '0';
    process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
    process.env.DEFAULT_MODEL_NAME = 'test-model';

    // Clear any existing connections first
    await closeConnection().catch(() => {});
    
    // Connect to the test database
    await connectToMongoDB();
    
    // Create Express app
    app = createApp();
  });

  afterAll(async () => {
    await closeConnection();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Clear database before each test to ensure clean state
    const { getDatabase } = require('../../src/database/connection');
    try {
      const db = getDatabase();
      const collections = await db.listCollections().toArray();
      for (const collection of collections) {
        await db.collection(collection.name).deleteMany({});
      }
    } catch (error) {
      console.log('No database connection available for cleanup');
    }
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        service: expect.any(String),
        version: expect.any(String),
        ollama: expect.objectContaining({
          baseUrl: expect.any(String),
          defaultModel: expect.any(String),
          accessible: true
        })
      });
    });
  });

  describe('Image Description API', () => {
    it('should describe an uploaded image', async () => {
      const imageBuffer = Buffer.from('fake-image-data');

      const response = await request(app)
        .post('/describe-image')
        .attach('imageFile', imageBuffer, 'test.jpg')
        .field('prompt', 'Describe this image')
        .field('model', 'test-model')
        .expect(200);

      expect(response.body).toMatchObject({
        description: 'Test image description',
        modelUsed: 'test-model',
        createdAt: expect.any(String),
        timings: expect.any(Object),
        tokenCounts: expect.any(Object)
      });
    });

    it('should return error when no image is uploaded', async () => {
      const response = await request(app)
        .post('/describe-image')
        .field('prompt', 'Describe this image')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'No image file uploaded. Please include a file with the key "imageFile".'
      });
    });

    it('should use default prompt when none provided', async () => {
      const imageBuffer = Buffer.from('fake-image-data');

      const response = await request(app)
        .post('/describe-image')
        .attach('imageFile', imageBuffer, 'test.jpg')
        .expect(200);

      expect(response.body.description).toBe('Test image description');
    });
  });

  describe('Text Summarization API', () => {
    it('should summarize provided text', async () => {
      const response = await request(app)
        .post('/summarize-text')
        .send({
          text: 'This is a long text that needs to be summarized...',
          model: 'test-model'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        summary: 'Test summary',
        modelUsed: 'test-model',
        createdAt: expect.any(String),
        timings: expect.any(Object),
        tokenCounts: expect.any(Object)
      });
    });

    it('should return error when no text is provided', async () => {
      const response = await request(app)
        .post('/summarize-text')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Text is required for summarization'
      });
    });
  });

  describe('Forms API', () => {
    describe('POST /api/forms', () => {
      it('should save a new form', async () => {
        const formData = {
          formData: [
            { name: 'firstName', type: 'text' },
            { name: 'email', type: 'email' }
          ],
          fieldConfigurations: {
            firstName: { mandatory: true, validation: true },
            email: { mandatory: true, validation: true }
          },
          metadata: {
            formName: 'Test Form',
            version: '1.0.0'
          }
        };

        const response = await request(app)
          .post('/api/forms')
          .send(formData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Form saved successfully',
          data: {
            formId: expect.any(String),
            savedAt: expect.any(String)
          }
        });
      });

      it('should return error for invalid form data', async () => {
        const invalidFormData = {
          formData: null,
          fieldConfigurations: {}
        };

        const response = await request(app)
          .post('/api/forms')
          .send(invalidFormData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: expect.any(String)
        });
      });
    });

    describe('GET /api/forms', () => {
      beforeEach(async () => {
        // Create test forms
        const testForms = [
          {
            formData: [{ name: 'field1', type: 'text' }],
            fieldConfigurations: { field1: { mandatory: true, validation: true } },
            metadata: { createdAt: '2024-01-01T00:00:00Z', formName: 'Form 1', version: '1.0.0' }
          },
          {
            formData: [{ name: 'field2', type: 'email' }],
            fieldConfigurations: { field2: { mandatory: true, validation: true } },
            metadata: { createdAt: '2024-01-02T00:00:00Z', formName: 'Form 2', version: '1.0.0' }
          }
        ];

        for (const form of testForms) {
          await request(app)
            .post('/api/forms')
            .send({ ...form, originalJson: {} });
        }
      });

      it('should retrieve paginated forms', async () => {
        const response = await request(app)
          .get('/api/forms')
          .query({ page: '1', pageSize: '10' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          count: expect.any(Number),
          page: 1,
          pageSize: 10,
          totalPages: expect.any(Number),
          data: expect.any(Array)
        });

        expect(response.body.data).toHaveLength(2);
      });

      it('should handle pagination parameters', async () => {
        const response = await request(app)
          .get('/api/forms')
          .query({ page: '1', pageSize: '1' })
          .expect(200);

        expect(response.body.pageSize).toBe(1);
        expect(response.body.data).toHaveLength(1);
      });
    });
  });

  describe('Form Data API', () => {
    let testFormId: string;

    beforeEach(async () => {
      // Create a test form first
      const formResponse = await request(app)
        .post('/api/forms')
        .send({
          formData: [{ name: 'testField', type: 'text' }],
          fieldConfigurations: { testField: { mandatory: true, validation: true } },
          metadata: { formName: 'Test Form' }
        });

      testFormId = formResponse.body.data.formId;
    });

    describe('POST /api/form-data', () => {
      it('should save form data submission', async () => {
        const formDataSubmission = {
          formId: testFormId,
          formTitle: 'Test Form',
          formData: {
            testField: 'test value'
          },
          userInfo: {
            userId: 'user123',
            email: 'test@example.com'
          }
        };

        const response = await request(app)
          .post('/api/form-data')
          .send(formDataSubmission)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          message: expect.any(String),
          formId: testFormId,
          isNewSubmission: expect.any(Boolean),
          submittedAt: expect.any(String)
        });
      });

      it('should return error for missing formId', async () => {
        const invalidSubmission = {
          formData: { testField: 'test value' }
        };

        const response = await request(app)
          .post('/api/form-data')
          .send(invalidSubmission)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: expect.any(String)
        });
      });
    });

    describe('GET /api/form-data', () => {
      beforeEach(async () => {
        // Create test form data submissions
        await request(app)
          .post('/api/form-data')
          .send({
            formId: testFormId,
            formData: { testField: 'value1' }
          });

        await request(app)
          .post('/api/form-data')
          .send({
            formId: testFormId,
            formData: { testField: 'value2' }
          });
      });

      it('should retrieve form data submissions', async () => {
        const response = await request(app)
          .get('/api/form-data')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          count: expect.any(Number),
          page: 1,
          pageSize: 10,
          data: expect.any(Array)
        });
      });

      it('should filter by formId', async () => {
        const response = await request(app)
          .get('/api/form-data')
          .query({ formId: testFormId })
          .expect(200);

        expect(response.body.data.every((item: any) => item.formId === testFormId)).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-endpoint')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Endpoint not found'
      });
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/forms')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json"}')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });
});
