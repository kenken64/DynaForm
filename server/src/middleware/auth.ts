import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/connection';
import { ObjectId } from 'mongodb';
import { config } from '../config';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        email: string;
        role: string;
      };
    }
  }
}

interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export class AuthMiddleware {
  // Verify JWT token
  static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const secret = config.JWT_SECRET;
      if (!secret) {
        res.status(500).json({
          success: false,
          error: 'Server configuration error',
          message: 'JWT secret not configured'
        });
        return;
      }

      const decoded = jwt.verify(token, secret) as JWTPayload;

      // Check if token is blacklisted
      const db = getDatabase();
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
        _id: new ObjectId(decoded.userId),
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
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          error: 'Token expired',
          message: 'Please refresh your token'
        });
      } else if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'Token is malformed'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Authentication error',
          message: error.message
        });
      }
    }
  }

  // Check if user has required role
  static requireRole(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
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
  static async optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');

      if (!token) {
        next();
        return;
      }

      const secret = config.JWT_SECRET;
      if (!secret) {
        next();
        return;
      }

      const decoded = jwt.verify(token, secret) as JWTPayload;

      // Verify user still exists
      const db = getDatabase();
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({
        _id: new ObjectId(decoded.userId),
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
    } catch (error) {
      // Silently continue without authentication for optional auth
      next();
    }
  }
}

// Export middleware functions
export const verifyToken = AuthMiddleware.verifyToken;
export const requireRole = AuthMiddleware.requireRole;
export const optionalAuth = AuthMiddleware.optionalAuth;
