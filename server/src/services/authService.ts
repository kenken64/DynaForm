import { ObjectId } from 'mongodb';
import { getDatabase } from '../database/connection';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { webauthnService } from './webauthnService';

// Interfaces
export interface User {
  _id?: ObjectId;
  id?: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  passkeys?: PasskeyCredential[];
}

export interface PasskeyCredential {
  credentialId: string;
  publicKey: string;
  friendlyName: string;
  counter: number;
  createdAt: Date;
  lastUsed?: Date;
  deviceType: 'platform' | 'cross-platform';
  userAgent?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  message?: string;
}

export interface PasskeyRegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    alg: number;
    type: string;
  }>;
  authenticatorSelection: {
    authenticatorAttachment?: string;
    userVerification: string;
  };
  timeout: number;
  attestation: string;
}

export interface PasskeyAuthenticationOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials?: Array<{
    type: string;
    id: string;
  }>;
  userVerification: string;
}

export const authService = {
  // Register a new user (step 1: user information)
  async registerUser(fullName: string, email: string, username: string): Promise<AuthResult> {
    try {
      const db = getDatabase();
      const usersCollection = db.collection<User>('users');

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
      const newUser: User = {
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
    } catch (error: any) {
      console.error('User registration error:', error);
      return {
        success: false,
        error: 'Registration failed',
        message: error.message
      };
    }
  },

  // Generate passkey registration options
  async generatePasskeyRegistrationOptions(userId: string): Promise<any> {
    try {
      const db = getDatabase();
      const usersCollection = db.collection<User>('users');

      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        throw new Error('User not found');
      }

      return await webauthnService.generateRegistrationOptions(userId, user.email, user.fullName);
    } catch (error: any) {
      console.error('Generate passkey registration options error:', error);
      throw error;
    }
  },

  // Verify passkey registration
  async verifyPasskeyRegistration(userId: string, credential: any, friendlyName?: string): Promise<AuthResult> {
    try {
      const verification = await webauthnService.verifyRegistrationResponse(
        userId,
        credential,
        friendlyName
      );

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
    } catch (error: any) {
      console.error('Verify passkey registration error:', error);
      return {
        success: false,
        error: 'Registration verification failed',
        message: error.message
      };
    }
  },

  // Generate passkey authentication options
  async generatePasskeyAuthenticationOptions(userEmail?: string): Promise<any> {
    try {
      return await webauthnService.generateAuthenticationOptions(userEmail);
    } catch (error: any) {
      console.error('Generate passkey authentication options error:', error);
      throw error;
    }
  },

  // Verify passkey authentication
  async verifyPasskeyAuthentication(credential: any): Promise<AuthResult> {
    try {
      const verification = await webauthnService.verifyAuthenticationResponse(credential);

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
    } catch (error: any) {
      console.error('Verify passkey authentication error:', error);
      return {
        success: false,
        error: 'Authentication verification failed',
        message: error.message
      };
    }
  },

  // Get user's passkeys
  async getUserPasskeys(userId: string): Promise<any[]> {
    try {
      return await webauthnService.getUserPasskeys(userId);
    } catch (error: any) {
      console.error('Get user passkeys error:', error);
      return [];
    }
  },

  // Delete a passkey
  async deletePasskey(userId: string, credentialId: string): Promise<AuthResult> {
    try {
      const result = await webauthnService.deletePasskey(userId, credentialId);

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
    } catch (error: any) {
      console.error('Delete passkey error:', error);
      return {
        success: false,
        error: 'Failed to delete passkey',
        message: error.message
      };
    }
  },

  // Generate JWT tokens
  generateTokens(userId: string): { accessToken: string; refreshToken: string } {
    const jwtSecret = config.JWT_SECRET as string;
    const jwtRefreshSecret = config.JWT_REFRESH_SECRET as string;
    const expiresIn = config.JWT_EXPIRES_IN as string;
    const refreshExpiresIn = config.JWT_REFRESH_EXPIRES_IN as string;

    const accessToken = jwt.sign(
      { userId, type: 'access' },
      jwtSecret
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      jwtRefreshSecret
    );

    return { accessToken, refreshToken };
  },

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<AuthResult> {
    try {
      const jwtRefreshSecret = config.JWT_REFRESH_SECRET as string;
      
      const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as any;
      
      if (decoded.type !== 'refresh') {
        return {
          success: false,
          error: 'Invalid token type',
          message: 'Provided token is not a refresh token'
        };
      }

      const db = getDatabase();
      const usersCollection = db.collection<User>('users');
      
      const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
      
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
    } catch (error: any) {
      console.error('Refresh token error:', error);
      return {
        success: false,
        error: 'Invalid refresh token',
        message: 'The refresh token is invalid or expired'
      };
    }
  },

  // Revoke refresh token (logout)
  async revokeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    try {
      const db = getDatabase();
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
    } catch (error: any) {
      console.error('Revoke refresh token error:', error);
    }
  },

  // Revoke access token (logout)
  async revokeAccessToken(userId: string, accessToken: string): Promise<void> {
    try {
      const db = getDatabase();
      const blacklistCollection = db.collection('token_blacklist');
      
      // Decode token to get expiration
      const decoded = jwt.decode(accessToken) as any;
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
    } catch (error: any) {
      console.error('Revoke access token error:', error);
    }
  },

  // Check if token is blacklisted
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const db = getDatabase();
      const blacklistCollection = db.collection('token_blacklist');
      
      const blacklistedToken = await blacklistCollection.findOne({
        token,
        expiresAt: { $gt: new Date() } // Only check non-expired blacklist entries
      });

      return !!blacklistedToken;
    } catch (error: any) {
      console.error('Check token blacklist error:', error);
      return false; // If there's an error, don't block the request
    }
  },

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const db = getDatabase();
      const usersCollection = db.collection<User>('users');

      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      
      if (!user) {
        return null;
      }

      // Return user without sensitive data
      return {
        id: user._id!.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      } as User;
    } catch (error: any) {
      console.error('Get user by ID error:', error);
      return null;
    }
  }
};
