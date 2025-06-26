"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = exports.optionalAuth = exports.requireRole = exports.verifyToken = void 0;
exports.corsMiddleware = corsMiddleware;
exports.errorHandler = errorHandler;
// Export auth middleware
var auth_1 = require("./auth");
Object.defineProperty(exports, "verifyToken", { enumerable: true, get: function () { return auth_1.verifyToken; } });
Object.defineProperty(exports, "requireRole", { enumerable: true, get: function () { return auth_1.requireRole; } });
Object.defineProperty(exports, "optionalAuth", { enumerable: true, get: function () { return auth_1.optionalAuth; } });
Object.defineProperty(exports, "AuthMiddleware", { enumerable: true, get: function () { return auth_1.AuthMiddleware; } });
function corsMiddleware(req, res, next) {
    const corsOrigin = process.env.CORS_ORIGIN || '*';
    const allowCredentials = process.env.CORS_CREDENTIALS === 'true';
    // Handle multiple origins (comma-separated)
    if (corsOrigin !== '*') {
        const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());
        const requestOrigin = req.headers.origin;
        if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
            res.header('Access-Control-Allow-Origin', requestOrigin);
        }
        else if (allowedOrigins.length === 1) {
            res.header('Access-Control-Allow-Origin', allowedOrigins[0]);
        }
    }
    else {
        res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (allowCredentials) {
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
}
function errorHandler(error, req, res, next) {
    console.error('Error:', error);
    // Handle specific error types
    if (error.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: error.message
        });
        return;
    }
    if (error.name === 'CastError') {
        res.status(400).json({
            success: false,
            error: 'Invalid ID format',
            message: 'The provided ID is not valid'
        });
        return;
    }
    // Default error response
    res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
}
//# sourceMappingURL=index.js.map