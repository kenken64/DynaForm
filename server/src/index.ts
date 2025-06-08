import { config } from './config';
import { createApp } from './app';
import { connectToMongoDB, closeConnection } from './database/connection';
import { redisCacheService } from './services/redisCacheService';

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    
    // Initialize Redis cache service
    console.log('🔧 Initializing Redis cache service...');
    const redisHealthy = await redisCacheService.healthCheck();
    if (redisHealthy) {
      console.log('✅ Redis cache service initialized successfully');
    } else {
      console.log('⚠️ Redis cache service not available, continuing without cache');
    }
    
    // Create Express app
    const app = createApp();
    
    // Start server
    const server = app.listen(config.PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${config.PORT}`);
      console.log(`📡 Ollama endpoint configured at: ${config.OLLAMA_BASE_URL}`);
      console.log(`🤖 Default Qwen VL model for API: ${config.DEFAULT_MODEL_NAME}`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
      
      if (config.DEFAULT_MODEL_NAME === 'qwen:7b') {
        console.warn("⚠️ WARNING: Update DEFAULT_MODEL_NAME in your .env file.");
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📡 ${signal} received. Shutting down gracefully...`);
      
      server.close(async () => {
        console.log('🔄 HTTP server closed.');
        
        // Disconnect Redis
        await redisCacheService.disconnect();
        
        await closeConnection();
        console.log('✅ Graceful shutdown complete.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();