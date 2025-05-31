"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsMiddleware = corsMiddleware;
exports.errorHandler = errorHandler;
function corsMiddleware(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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