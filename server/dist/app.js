"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const config_1 = require("./config");
const middleware_1 = require("./middleware");
const routes_1 = __importDefault(require("./routes"));
function createApp() {
    const app = (0, express_1.default)();
    // Basic middleware
    app.use(express_1.default.json({ limit: config_1.config.JSON_LIMIT }));
    app.use(express_1.default.urlencoded({ extended: true, limit: config_1.config.JSON_LIMIT }));
    // CORS middleware
    app.use(middleware_1.corsMiddleware);
    // Routes
    app.use(routes_1.default);
    // 404 handler for unknown routes
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            error: 'Endpoint not found'
        });
    });
    // Error handling middleware (must be last)
    app.use(middleware_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map