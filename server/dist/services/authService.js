"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const mongodb_1 = require("mongodb");
const connection_1 = require("../database/connection");
const jwt = __importStar(require("jsonwebtoken"));
const config_1 = require("../config");
const webauthnService_1 = require("./webauthnService");
exports.authService = {
    // Register a new user (step 1: user information)
    async registerUser(fullName, email, username) {
        try {
            const db = (0, connection_1.getDatabase)();
            const usersCollection = db.collection('users');
            // Check if user already exists
            const existingUser = await usersCollection.findOne({
                $or: [
                    { email: email.toLowerCase() },
                    { username: username.toLowerCase() }
                ]
            });
            if (existingUser) {
                return {
                    success: false,
                    error: 'User already exists',
                    message: existingUser.email === email.toLowerCase()
                        ? 'Email address is already registered'
                        : 'Username is already taken'
                };
            }
            // Create new user
            const newUser = {
                username: username.toLowerCase(),
                email: email.toLowerCase(),
                fullName,
                role: 'user',
                isActive: true,
                isEmailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                passkeys: []
            };
            const result = await usersCollection.insertOne(newUser);
            return {
                success: true,
                userId: result.insertedId.toString(),
                message: 'User registered successfully'
            };
        }
        catch (error) {
            console.error('User registration error:', error);
            return {
                success: false,
                error: 'Registration failed',
                message: error.message
            };
        }
    },
    // Generate passkey registration options
    async generatePasskeyRegistrationOptions(userId) {
        try {
            const db = (0, connection_1.getDatabase)();
            const usersCollection = db.collection('users');
            const user = await usersCollection.findOne({ _id: new mongodb_1.ObjectId(userId) });
            if (!user) {
                throw new Error('User not found');
            }
            return await webauthnService_1.webauthnService.generateRegistrationOptions(userId, user.email, user.fullName);
        }
        catch (error) {
            console.error('Generate passkey registration options error:', error);
            throw error;
        }
    },
    // Verify passkey registration
    async verifyPasskeyRegistration(userId, credential, friendlyName) {
        try {
            const verification = await webauthnService_1.webauthnService.verifyRegistrationResponse(userId, credential, friendlyName);
            if (!verification.verified) {
                return {
                    success: false,
                    error: 'Registration verification failed',
                    message: verification.error || 'Failed to verify passkey registration'
                };
            }
            return {
                success: true,
                message: 'Passkey registered successfully'
            };
        }
        catch (error) {
            console.error('Verify passkey registration error:', error);
            return {
                success: false,
                error: 'Registration verification failed',
                message: error.message
            };
        }
    },
    // Generate passkey authentication options
    async generatePasskeyAuthenticationOptions(userEmail) {
        try {
            return await webauthnService_1.webauthnService.generateAuthenticationOptions(userEmail);
        }
        catch (error) {
            console.error('Generate passkey authentication options error:', error);
            throw error;
        }
    },
    // Verify passkey authentication
    async verifyPasskeyAuthentication(credential) {
        try {
            const verification = await webauthnService_1.webauthnService.verifyAuthenticationResponse(credential);
            if (!verification.verified || !verification.user) {
                return {
                    success: false,
                    error: 'Authentication verification failed',
                    message: verification.error || 'Failed to verify passkey authentication'
                };
            }
            // Generate tokens
            const { accessToken, refreshToken } = this.generateTokens(verification.user.id);
            return {
                success: true,
                user: verification.user,
                accessToken,
                refreshToken,
                message: 'Authentication successful'
            };
        }
        catch (error) {
            console.error('Verify passkey authentication error:', error);
            return {
                success: false,
                error: 'Authentication verification failed',
                message: error.message
            };
        }
    },
    // Get user's passkeys
    async getUserPasskeys(userId) {
        try {
            return await webauthnService_1.webauthnService.getUserPasskeys(userId);
        }
        catch (error) {
            console.error('Get user passkeys error:', error);
            return [];
        }
    },
    // Delete a passkey
    async deletePasskey(userId, credentialId) {
        try {
            const result = await webauthnService_1.webauthnService.deletePasskey(userId, credentialId);
            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Failed to delete passkey',
                    message: result.error || 'No passkey found with the provided credential ID'
                };
            }
            return {
                success: true,
                message: 'Passkey deleted successfully'
            };
        }
        catch (error) {
            console.error('Delete passkey error:', error);
            return {
                success: false,
                error: 'Failed to delete passkey',
                message: error.message
            };
        }
    },
    // Generate JWT tokens
    generateTokens(userId) {
        const jwtSecret = config_1.config.JWT_SECRET;
        const jwtRefreshSecret = config_1.config.JWT_REFRESH_SECRET;
        const expiresIn = config_1.config.JWT_EXPIRES_IN;
        const refreshExpiresIn = config_1.config.JWT_REFRESH_EXPIRES_IN;
        const accessToken = jwt.sign({ userId, type: 'access' }, jwtSecret);
        const refreshToken = jwt.sign({ userId, type: 'refresh' }, jwtRefreshSecret);
        return { accessToken, refreshToken };
    },
    // Refresh access token
    async refreshAccessToken(refreshToken) {
        try {
            const jwtRefreshSecret = config_1.config.JWT_REFRESH_SECRET;
            const decoded = jwt.verify(refreshToken, jwtRefreshSecret);
            if (decoded.type !== 'refresh') {
                return {
                    success: false,
                    error: 'Invalid token type',
                    message: 'Provided token is not a refresh token'
                };
            }
            const db = (0, connection_1.getDatabase)();
            const usersCollection = db.collection('users');
            const user = await usersCollection.findOne({ _id: new mongodb_1.ObjectId(decoded.userId) });
            if (!user || !user.isActive) {
                return {
                    success: false,
                    error: 'User not found or inactive',
                    message: 'User account not found or deactivated'
                };
            }
            const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(decoded.userId);
            return {
                success: true,
                accessToken,
                refreshToken: newRefreshToken
            };
        }
        catch (error) {
            console.error('Refresh token error:', error);
            return {
                success: false,
                error: 'Invalid refresh token',
                message: 'The refresh token is invalid or expired'
            };
        }
    },
    // Revoke refresh token (logout)
    async revokeRefreshToken(userId, refreshToken) {
        try {
            const db = (0, connection_1.getDatabase)();
            const blacklistCollection = db.collection('token_blacklist');
            // Add refresh token to blacklist
            await blacklistCollection.insertOne({
                token: refreshToken,
                userId,
                type: 'refresh',
                revokedAt: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            });
            console.log(`Refresh token revoked for user ${userId}`);
        }
        catch (error) {
            console.error('Revoke refresh token error:', error);
        }
    },
    // Revoke access token (logout)
    async revokeAccessToken(userId, accessToken) {
        try {
            const db = (0, connection_1.getDatabase)();
            const blacklistCollection = db.collection('token_blacklist');
            // Decode token to get expiration
            const decoded = jwt.decode(accessToken);
            const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 60 * 60 * 1000); // 1 hour default
            // Add access token to blacklist
            await blacklistCollection.insertOne({
                token: accessToken,
                userId,
                type: 'access',
                revokedAt: new Date(),
                expiresAt
            });
            console.log(`Access token revoked for user ${userId}`);
        }
        catch (error) {
            console.error('Revoke access token error:', error);
        }
    },
    // Check if token is blacklisted
    async isTokenBlacklisted(token) {
        try {
            const db = (0, connection_1.getDatabase)();
            const blacklistCollection = db.collection('token_blacklist');
            const blacklistedToken = await blacklistCollection.findOne({
                token,
                expiresAt: { $gt: new Date() } // Only check non-expired blacklist entries
            });
            return !!blacklistedToken;
        }
        catch (error) {
            console.error('Check token blacklist error:', error);
            return false; // If there's an error, don't block the request
        }
    },
    // Get user by ID
    async getUserById(userId) {
        try {
            const db = (0, connection_1.getDatabase)();
            const usersCollection = db.collection('users');
            const user = await usersCollection.findOne({ _id: new mongodb_1.ObjectId(userId) });
            if (!user) {
                return null;
            }
            // Return user without sensitive data
            return {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                isActive: user.isActive,
                isEmailVerified: user.isEmailVerified,
                lastLoginAt: user.lastLoginAt,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };
        }
        catch (error) {
            console.error('Get user by ID error:', error);
            return null;
        }
    }
};
//# sourceMappingURL=authService.js.map