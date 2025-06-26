import { Request, Response } from 'express';

export const ndiController = {
  // Register user with NDI verification data
  async registerUser(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, email, username, ndiVerificationData } = req.body;

      if (!fullName || !email || !username || !ndiVerificationData) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Full name, email, username, and NDI verification data are required'
        });
        return;
      }

      // Import auth service to handle user creation and JWT generation
      const { authService } = await import('../services/authService');

      // Check if user already exists
      const db = await import('../database/connection').then(m => m.getDatabase());
      const usersCollection = db.collection('users');
      
      const existingUser = await usersCollection.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'User already exists',
          message: 'A user with this email or username already exists'
        });
        return;
      }

      // Create user with NDI verification data
      const result = await authService.registerUser(fullName, email, username);

      if (!result.success || !result.userId) {
        res.status(400).json({
          success: false,
          error: result.error || 'Registration failed',
          message: result.message || 'Failed to create user account'
        });
        return;
      }

      // Store NDI verification data in user record
      await usersCollection.updateOne(
        { _id: new (await import('mongodb')).ObjectId(result.userId) },
        {
          $set: {
            ndiVerificationData,
            isNdiVerified: true,
            ndiVerifiedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      // Get the created user first
      const user = await usersCollection.findOne({ 
        _id: new (await import('mongodb')).ObjectId(result.userId) 
      });

      if (!user) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'Failed to retrieve created user'
        });
        return;
      }

      // Generate JWT tokens with user data (same as passkey auth flow)
      const { accessToken, refreshToken } = authService.generateTokensWithUserData(user);

      const userResponse = {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        isNdiVerified: user.isNdiVerified,
        lastLoginAt: new Date(),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.json({
        success: true,
        user: userResponse,
        accessToken,
        refreshToken,
        message: 'NDI user registration successful'
      });

    } catch (error) {
      console.error('NDI user registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Create a new proof request
  async createProofRequest(req: Request, res: Response): Promise<void> {
    try {
      // Use the configured webhook URL from environment variables
      const webhookUrl = `${process.env.FRONTEND_BASE_URL || 'https://formbt.com'}/api/ndi-webhook`;
      console.log("🔗 Webhook URL:", webhookUrl);

      // 1. Authenticate with NDI
      const authRes = await fetch("https://staging.bhutanndi.com/authentication/v1/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.NDI_CLIENT_ID,
          client_secret: process.env.NDI_CLIENT_SECRET,
          grant_type: "client_credentials",
        }),
      });

      if (!authRes.ok) {
        throw new Error(`NDI authentication failed: ${authRes.status}`);
      }

      const authData = await authRes.json();
      const accessToken = authData.access_token;

      if (!accessToken) {
        throw new Error("Failed to obtain access token from NDI");
      }

      // 2. Register webhook with NDI
      const registerRes = await fetch("https://demo-client.bhutanndi.com/webhook/v1/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          webhookId: process.env.WEBHOOK_ID,
          webhookURL: webhookUrl,
          authentication: {
            type: "OAuth2",
            version: "v2",
            data: { token: process.env.WEBHOOK_TOKEN },
          },
        }),
      });

      if (!registerRes.ok) {
        console.warn("Webhook registration failed, continuing anyway:", registerRes.status);
      }

      // 3. Create proof request
      const proofRes = await fetch("https://demo-client.bhutanndi.com/verifier/v1/proof-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          proofName: "Verify Foundational ID",
          proofAttributes: [
            {
              name: "ID Number",
              restrictions: [
                {
                  schema_name: "https://dev-schema.ngotag.com/schemas/c7952a0a-e9b5-4a4b-a714-1e5d0a1ae076",
                },
              ],
            },
            {
              name: "Full Name",
              restrictions: [
                {
                  schema_name: "https://dev-schema.ngotag.com/schemas/c7952a0a-e9b5-4a4b-a714-1e5d0a1ae076",
                },
              ],
            },
          ],
        }),
      });

      if (!proofRes.ok) {
        throw new Error(`Proof request creation failed: ${proofRes.status}`);
      }

      const proofData = await proofRes.json();

      if (!proofData.data?.proofRequestThreadId) {
        throw new Error("Invalid proof request response - missing thread ID");
      }

      // 4. Subscribe to webhook notifications
      const subscribeRes = await fetch("https://demo-client.bhutanndi.com/webhook/v1/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          webhookId: process.env.WEBHOOK_ID,
          threadId: proofData.data.proofRequestThreadId,
        }),
      });

      if (!subscribeRes.ok) {
        console.warn("Webhook subscription failed, continuing anyway:", subscribeRes.status);
      }

      // ✅ Return QR code URL
      res.json({ 
        success: true,
        url: proofData.data.proofRequestURL,
        threadId: proofData.data.proofRequestThreadId 
      });

    } catch (error) {
      console.error("NDI Proof Request Error:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to create proof request",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  },

  // Get proof status by thread ID
  async getProofStatus(req: Request, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;

      if (!threadId) {
        res.status(400).json({
          success: false,
          error: "Thread ID is required"
        });
        return;
      }

      // 1. Authenticate with NDI
      const authRes = await fetch("https://staging.bhutanndi.com/authentication/v1/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.NDI_CLIENT_ID,
          client_secret: process.env.NDI_CLIENT_SECRET,
          grant_type: "client_credentials",
        }),
      });

      if (!authRes.ok) {
        throw new Error(`NDI authentication failed: ${authRes.status}`);
      }

      const authData = await authRes.json();
      const accessToken = authData.access_token;

      // 2. Get proof status
      const statusRes = await fetch(`https://demo-client.bhutanndi.com/verifier/v1/proof-request/${threadId}/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!statusRes.ok) {
        throw new Error(`Failed to get proof status: ${statusRes.status}`);
      }

      const statusData = await statusRes.json();

      res.json({
        success: true,
        status: statusData
      });

    } catch (error) {
      console.error("NDI Proof Status Error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get proof status",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
};

// Export individual functions for compatibility
export const { createProofRequest, getProofStatus, registerUser } = ndiController;
