import express from 'express';
import config from './config';
import { connectToMongoDB, closeConnection } from './database/connection';
import { corsMiddleware, errorHandler, notFoundHandler, requestLogger } from './middleware';
import routes from './routes';

class App {
    public app: express.Application;

    constructor() {
        this.app = express();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddleware(): void {
        // Request logging
        this.app.use(requestLogger);

        // CORS
        this.app.use(corsMiddleware);

        // Body parsing
        this.app.use(express.json({ limit: config.JSON_LIMIT }));
        this.app.use(express.urlencoded({ extended: true, limit: config.JSON_LIMIT }));

        // Trust proxy if behind reverse proxy
        this.app.set('trust proxy', true);
    }

    private initializeRoutes(): void {
        // API routes
        this.app.use('/', routes);

        // Health check at root
        this.app.get('/', (req, res) => {
            res.json({
                success: true,
                message: 'doc2formjson API is running',
                version: '1.0.0',
                timestamp: new Date().toISOString()
            });
        });
    }

    private initializeErrorHandling(): void {
        // 404 handler
        this.app.use(notFoundHandler);

        // Global error handler
        this.app.use(errorHandler);
    }

    public async start(): Promise<void> {
        try {
            // Connect to MongoDB
            await connectToMongoDB();

            // Start server
            this.app.listen(config.PORT, () => {
                console.log(`🚀 Server listening on http://localhost:${config.PORT}`);
                console.log(`🔗 Ollama endpoint configured at: ${config.OLLAMA_BASE_URL}`);
                console.log(`🤖 Default model: ${config.DEFAULT_MODEL_NAME}`);
                console.log(`🗄️  MongoDB: ${config.MONGODB_URI}/${config.MONGODB_DB_NAME}`);
                console.log(`🌍 Environment: ${config.NODE_ENV}`);
                
                if (config.DEFAULT_MODEL_NAME === 'qwen:7b') {
                    console.warn("⚠️ WARNING: Update DEFAULT_MODEL_NAME in your environment variables.");
                }
            });

            // Graceful shutdown
            this.setupGracefulShutdown();

        } catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    }

    private setupGracefulShutdown(): void {
        const shutdown = async (signal: string) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);
            try {
                await closeConnection();
                console.log('✅ Server shut down successfully');
                process.exit(0);
            } catch (error) {
                console.error('❌ Error during shutdown:', error);
                process.exit(1);
            }
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    }
}

export default App;
