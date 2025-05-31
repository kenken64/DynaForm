"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const app_1 = require("./app");
const connection_1 = require("./database/connection");
async function startServer() {
    try {
        // Connect to MongoDB
        await (0, connection_1.connectToMongoDB)();
        // Create Express app
        const app = (0, app_1.createApp)();
        // Start server
        const server = app.listen(config_1.config.PORT, () => {
            console.log(`🚀 Server listening on http://localhost:${config_1.config.PORT}`);
            console.log(`📡 Ollama endpoint configured at: ${config_1.config.OLLAMA_BASE_URL}`);
            console.log(`🤖 Default Qwen VL model for API: ${config_1.config.DEFAULT_MODEL_NAME}`);
            console.log(`🌍 Environment: ${config_1.config.NODE_ENV}`);
            if (config_1.config.DEFAULT_MODEL_NAME === 'qwen:7b') {
                console.warn("⚠️ WARNING: Update DEFAULT_MODEL_NAME in your .env file.");
            }
        });
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            console.log(`\n📡 ${signal} received. Shutting down gracefully...`);
            server.close(async () => {
                console.log('🔄 HTTP server closed.');
                await (0, connection_1.closeConnection)();
                console.log('✅ Graceful shutdown complete.');
                process.exit(0);
            });
        };
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Start the server
startServer();
//# sourceMappingURL=index.js.map