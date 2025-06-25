import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type GenerateRegistrationOptionsOpts,
  type GenerateAuthenticationOptionsOpts,
  type VerifyRegistrationResponseOpts,
  type VerifyAuthenticationResponseOpts,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { getDatabase } from '../database/connection';
import { ObjectId } from 'mongodb';
import { config } from '../config';
import { PasskeyCredential } from './authService';

// WebAuthn configuration from environment variables
const RP_NAME = process.env.RP_NAME || 'DynaForm';
const RP_ID = process.env.RP_ID || 'localhost';
const WEBAUTHN_ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:4200'; // Frontend origin

export interface PasskeyChallenge {
  userId?: string;
  challenge: string;
  type: 'registration' | 'authentication';
  createdAt: Date;
  expiresAt: Date;
}

export const webauthnService = {
  // Generate passkey registration options using SimpleWebAuthn
  async generateRegistrationOptions(userId: string, userEmail: string, userName: string): Promise<any> {
    try {
      const db = getDatabase();
      const usersCollection = db.collection('users');
      const challengesCollection = db.collection('passkey_challenges');

      // Get user's existing passkeys
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        throw new Error('User not found');
      }

      const userPasskeys = user.passkeys || [];
      const excludeCredentials = userPasskeys.map((passkey: PasskeyCredential) => ({
        id: new Uint8Array(Buffer.from(passkey.credentialId, 'base64url')),
        type: 'public-key' as const,
      }));

      const opts: GenerateRegistrationOptionsOpts = {
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: new TextEncoder().encode(userId),
        userName: userEmail,
        userDisplayName: userName,
        timeout: 60000,
        attestationType: 'none',
        excludeCredentials,
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
          authenticatorAttachment: 'platform',
        },
        supportedAlgorithmIDs: [-7, -257], // ES256, RS256
      };

      const options = await generateRegistrationOptions(opts);

      // Store challenge for verification
      const challengeDoc: PasskeyChallenge = {
        userId,
        challenge: options.challenge,
        type: 'registration',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      };

      await challengesCollection.insertOne(challengeDoc);

      return options;
    } catch (error) {
      console.error('Generate registration options error:', error);
      throw error;
    }
  },

  // Verify passkey registration using SimpleWebAuthn
  async verifyRegistrationResponse(
    userId: string,
    response: RegistrationResponseJSON,
    friendlyName?: string
  ): Promise<{ verified: boolean; registrationInfo?: any; error?: string }> {
    try {
      const db = getDatabase();
      const usersCollection = db.collection('users');
      const challengesCollection = db.collection('passkey_challenges');

      // Get stored challenge
      const challengeDoc = await challengesCollection.findOne({
        userId,
        type: 'registration',
        expiresAt: { $gt: new Date() },
      });

      if (!challengeDoc) {
        return {
          verified: false,
          error: 'Challenge not found or expired',
        };
      }

      const opts: VerifyRegistrationResponseOpts = {
        response,
        expectedChallenge: challengeDoc.challenge,
        expectedOrigin: WEBAUTHN_ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: false,
      };

      const verification = await verifyRegistrationResponse(opts);

      if (!verification.verified || !verification.registrationInfo) {
        return {
          verified: false,
          error: 'Passkey registration verification failed',
        };
      }

      // Store the passkey
      const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

      const newPasskey: PasskeyCredential = {
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString('base64'),
        friendlyName: friendlyName || 'Passkey Device',
        counter: credential.counter,
        createdAt: new Date(),
        deviceType: credentialDeviceType === 'multiDevice' ? 'cross-platform' : 'platform',
      };

      // Add passkey to user
      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $push: { passkeys: newPasskey } as any,
          $set: {
            updatedAt: new Date(),
            isEmailVerified: true,
          },
        }
      );

      // Clean up challenge
      await challengesCollection.deleteOne({ _id: challengeDoc._id });

      return {
        verified: true,
        registrationInfo: verification.registrationInfo,
      };
    } catch (error) {
      console.error('Verify registration response error:', error);
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Registration verification failed',
      };
    }
  },

  // Generate passkey authentication options using SimpleWebAuthn
  async generateAuthenticationOptions(userEmail?: string): Promise<any> {
    try {
      const db = getDatabase();
      const challengesCollection = db.collection('passkey_challenges');

      let allowCredentials: { id: string; type: 'public-key' }[] = [];

      // If user email is provided, get their specific passkeys
      if (userEmail) {
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ email: userEmail.toLowerCase() });

        if (user && user.passkeys) {
          allowCredentials = user.passkeys.map((passkey: PasskeyCredential) => ({
            id: passkey.credentialId,
            type: 'public-key' as const,
          }));
        }
      }

      const opts: GenerateAuthenticationOptionsOpts = {
        timeout: 60000,
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
        userVerification: 'preferred',
        rpID: RP_ID,
      };

      const options = await generateAuthenticationOptions(opts);

      // Store challenge for verification
      const challengeDoc: PasskeyChallenge = {
        challenge: options.challenge,
        type: 'authentication',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      };

      await challengesCollection.insertOne(challengeDoc);

      return options;
    } catch (error) {
      console.error('Generate authentication options error:', error);
      throw error;
    }
  },

  // Verify passkey authentication using SimpleWebAuthn
  async verifyAuthenticationResponse(response: AuthenticationResponseJSON): Promise<{
    verified: boolean;
    user?: any;
    authenticationInfo?: any;
    error?: string;
  }> {
    try {
      const db = getDatabase();
      const usersCollection = db.collection('users');
      const challengesCollection = db.collection('passkey_challenges');

      // Extract challenge from client data
      let clientChallenge: string;
      try {
        const clientDataJSON = JSON.parse(Buffer.from(response.response.clientDataJSON, 'base64').toString());
        clientChallenge = clientDataJSON.challenge;
      } catch (error) {
        return {
          verified: false,
          error: 'Failed to parse client data',
        };
      }

      // Get stored challenge using the challenge from the response
      const challengeDoc = await challengesCollection.findOne({
        challenge: clientChallenge,
        type: 'authentication',
        expiresAt: { $gt: new Date() },
      });

      if (!challengeDoc) {
        return {
          verified: false,
          error: 'Challenge not found or expired',
        };
      }

      // Find user by credential ID
      const credentialId = Buffer.from(response.rawId, 'base64url').toString('base64url');
      const user = await usersCollection.findOne({
        'passkeys.credentialId': credentialId,
      });

      if (!user) {
        return {
          verified: false,
          error: 'User not found for this passkey',
        };
      }

      // Find the specific passkey
      const passkey = user.passkeys?.find((p: PasskeyCredential) => p.credentialId === credentialId);
      if (!passkey) {
        return {
          verified: false,
          error: 'Passkey not found',
        };
      }

      const opts: VerifyAuthenticationResponseOpts = {
        response,
        expectedChallenge: challengeDoc.challenge,
        expectedOrigin: WEBAUTHN_ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: passkey.credentialId,
          publicKey: new Uint8Array(Buffer.from(passkey.publicKey, 'base64')),
          counter: passkey.counter,
        },
        requireUserVerification: false,
      };

      const verification = await verifyAuthenticationResponse(opts);

      if (!verification.verified) {
        return {
          verified: false,
          error: 'Passkey authentication verification failed',
        };
      }

      // Update counter and last used
      await usersCollection.updateOne(
        {
          _id: user._id,
          'passkeys.credentialId': credentialId,
        },
        {
          $set: {
            lastLoginAt: new Date(),
            updatedAt: new Date(),
            'passkeys.$.lastUsed': new Date(),
            'passkeys.$.counter': verification.authenticationInfo.newCounter,
          },
        }
      );

      // Clean up challenge
      await challengesCollection.deleteOne({ _id: challengeDoc._id });

      // Return user without sensitive data
      const userResponse = {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: new Date(),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return {
        verified: true,
        user: userResponse,
        authenticationInfo: verification.authenticationInfo,
      };
    } catch (error) {
      console.error('Verify authentication response error:', error);
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Authentication verification failed',
      };
    }
  },

  // Get user's passkeys (without sensitive data)
  async getUserPasskeys(userId: string): Promise<Omit<PasskeyCredential, 'publicKey' | 'counter'>[]> {
    try {
      const db = getDatabase();
      const usersCollection = db.collection('users');

      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

      if (!user || !user.passkeys) {
        return [];
      }

      // Return passkeys without sensitive data
      return user.passkeys.map((passkey: PasskeyCredential) => ({
        credentialId: passkey.credentialId,
        publicKey: '', // Don't expose
        friendlyName: passkey.friendlyName,
        counter: 0, // Don't expose
        createdAt: passkey.createdAt,
        lastUsed: passkey.lastUsed,
        deviceType: passkey.deviceType,
        userAgent: passkey.userAgent,
      }));
    } catch (error) {
      console.error('Get user passkeys error:', error);
      return [];
    }
  },

  // Delete a passkey
  async deletePasskey(userId: string, credentialId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = getDatabase();
      const usersCollection = db.collection('users');

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $pull: { passkeys: { credentialId } } as any,
          $set: { updatedAt: new Date() },
        }
      );

      if (result.modifiedCount === 0) {
        return {
          success: false,
          error: 'Passkey not found',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete passkey error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete passkey',
      };
    }
  },
};
