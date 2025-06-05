"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireRole = exports.verifyToken = exports.AuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = require("../database/connection");
const mongodb_1 = require("mongodb");
const config_1 = require("../config");
class AuthMiddleware {
    // Verify JWT token
    static async verifyToken(req, res, next) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                res.status(401).json({
                    success: false,
                    error: 'Access denied',
                    message: 'No token provided'
                });
                return;
            }
            const secret = config_1.config.JWT_SECRET;
            if (!secret) {
                res.status(500).json({
                    success: false,
                    error: 'Server configuration error',
                    message: 'JWT secret not configured'
                });
                return;
            }
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            // Check if token is blacklisted
            const db = (0, connection_1.getDatabase)();
            const blacklistCollection = db.collection('token_blacklist');
            const blacklistedToken = await blacklistCollection.findOne({
                token,
                expiresAt: { $gt: new Date() }
            });
            if (blacklistedToken) {
                res.status(401).json({
                    success: false,
                    error: 'Token revoked',
                    message: 'This token has been revoked'
                });
                return;
            }
            // Verify user still exists and is active
            const usersCollection = db.collection('users');
            const user = await usersCollection.findOne({
                _id: new mongodb_1.ObjectId(decoded.userId),
                isActive: true
            });
            if (!user) {
                res.status(401).json({
                    success: false,
                    error: 'Access denied',
                    message: 'User not found or inactive'
                });
                return;
            }
            // Add user info to request
            req.user = {
                userId: decoded.userId,
                username: decoded.username,
                email: decoded.email,
                role: decoded.role
            };
            next();
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                res.status(401).json({
                    success: false,
                    error: 'Token expired',
                    message: 'Please refresh your token'
                });
            }
            else if (error.name === 'JsonWebTokenError') {
                res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                    message: 'Token is malformed'
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: 'Authentication error',
                    message: error.message
                });
            }
        }
    }
    // Check if user has required role
    static requireRole(roles) {
        return (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Access denied',
                    message: 'Authentication required'
                });
                return;
            }
            if (!roles.includes(req.user.role)) {
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                    message: `Required role: ${roles.join(' or ')}`
                });
                return;
            }
            next();
        };
    }
    // Optional authentication (doesn't fail if no token)
    static async optionalAuth(req, res, next) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                next();
                return;
            }
            const secret = config_1.config.JWT_SECRET;
            if (!secret) {
                next();
                return;
            }
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            // Verify user still exists
            const db = (0, connection_1.getDatabase)();
            const usersCollection = db.collection('users');
            const user = await usersCollection.findOne({
                _id: new mongodb_1.ObjectId(decoded.userId),
                isActive: true
            });
            if (user) {
                req.user = {
                    userId: decoded.userId,
                    username: decoded.username,
                    email: decoded.email,
                    role: decoded.role
                };
            }
            next();
        }
        catch (error) {
            // Silently continue without authentication for optional auth
            next();
        }
    }
}
exports.AuthMiddleware = AuthMiddleware;
// Export middleware functions
exports.verifyToken = AuthMiddleware.verifyToken;
exports.requireRole = AuthMiddleware.requireRole;
exports.optionalAuth = AuthMiddleware.optionalAuth;
//# sourceMappingURL=auth.js.map