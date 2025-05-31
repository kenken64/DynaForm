import express from 'express';
import { config } from './config';
import { corsMiddleware, errorHandler } from './middleware';
import routes from './routes';

export function createApp(): express.Application {
  const app = express();

  // Basic middleware
  app.use(express.json({ limit: config.JSON_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: config.JSON_LIMIT }));

  // CORS middleware
  app.use(corsMiddleware);

  // Routes
  app.use(routes);

  // 404 handler for unknown routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}