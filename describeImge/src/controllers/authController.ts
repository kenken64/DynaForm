import { Request, Response } from 'express';
import { authService } from '../services';

export const authController = {
  // Register new user (step 1 of registration process)
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, email, username } = req.body;

      // Validate required fields
      if (!fullName || !email || !username) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Full name, email, and username are required'
        });
        return;
      }

      const result = await authService.registerUser(fullName, email, username);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          userId: result.userId
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },

  // Begin passkey registration process
  async beginPasskeyRegistration(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'User ID is required'
        });
        return;
      }

      const options = await authService.generatePasskeyRegistrationOptions(userId);

      res.status(200).json({
        success: true,
        options
      });
    } catch (error: any) {
      console.error('Begin passkey registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },

  // Complete passkey registration process
  async finishPasskeyRegistration(req: Request, res: Response): Promise<void> {
    try {
      const { userId, credential, friendlyName } = req.body;

      if (!userId || !credential) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'User ID and credential are required'
        });
        return;
      }

      const result = await authService.verifyPasskeyRegistration(userId, credential, friendlyName);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Passkey registered successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }
    } catch (error: any) {
      console.error('Finish passkey registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },

  // Begin passkey authentication process
  async beginPasskeyAuthentication(req: Request, res: Response): Promise<void> {
    try {
      const options = await authService.generatePasskeyAuthenticationOptions();

      res.status(200).json({
        success: true,
        options
      });
    } catch (error: any) {
      console.error('Begin passkey authentication error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },

  // Complete passkey authentication process
  async finishPasskeyAuthentication(req: Request, res: Response): Promise<void> {
    try {
      const { credential } = req.body;

      if (!credential) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Credential is required'
        });
        return;
      }

      const result = await authService.verifyPasskeyAuthentication(credential);

      if (result.success && result.user && result.accessToken) {
        res.status(200).json({
          success: true,
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          message: 'Authentication successful'
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.error || 'Authentication failed',
          message: result.message || 'Invalid credentials'
        });
      }
    } catch (error: any) {
      console.error('Finish passkey authentication error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },

  // Get user's passkeys (requires authentication)
  async getPasskeys(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement authentication middleware to get userId from token
      const userId = req.headers['user-id'] as string; // Temporary for demo

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
        return;
      }

      const passkeys = await authService.getUserPasskeys(userId);

      res.status(200).json({
        success: true,
        passkeys
      });
    } catch (error: any) {
      console.error('Get passkeys error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },

  // Delete a passkey (requires authentication)
  async deletePasskey(req: Request, res: Response): Promise<void> {
    try {
      const { credentialId } = req.params;
      // TODO: Implement authentication middleware to get userId from token
      const userId = req.headers['user-id'] as string; // Temporary for demo

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
        return;
      }

      const result = await authService.deletePasskey(userId, credentialId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Passkey deleted successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }
    } catch (error: any) {
      console.error('Delete passkey error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },

  // Refresh access token
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Refresh token is required'
        });
        return;
      }

      const result = await authService.refreshAccessToken(refreshToken);

      if (result.success && result.accessToken) {
        res.status(200).json({
          success: true,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.error || 'Token refresh failed',
          message: result.message || 'Invalid refresh token'
        });
      }
    } catch (error: any) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },

  // Logout user
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?.userId; // Get from authenticated request
      const accessToken = req.header('Authorization')?.replace('Bearer ', '');

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      // Revoke access token if present
      if (accessToken) {
        await authService.revokeAccessToken(userId, accessToken);
      }

      // Revoke refresh token if present
      if (refreshToken) {
        await authService.revokeRefreshToken(userId, refreshToken);
      }

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },

  // Get current user info (requires authentication)
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // Get userId from authenticated request (set by auth middleware)
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
        return;
      }

      const user = await authService.getUserById(userId);

      if (user) {
        res.status(200).json({
          success: true,
          user
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User does not exist'
        });
      }
    } catch (error: any) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
};
