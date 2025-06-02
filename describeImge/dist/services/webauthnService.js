"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webauthnService = void 0;
const server_1 = require("@simplewebauthn/server");
const connection_1 = require("../database/connection");
const mongodb_1 = require("mongodb");
// WebAuthn configuration
const RP_NAME = 'DynaForm';
const RP_ID = process.env.RP_ID || 'localhost';
const ORIGIN = process.env.ORIGIN || 'http://localhost:4200'; // Frontend origin
exports.webauthnService = {
    // Generate passkey registration options using SimpleWebAuthn
    async generateRegistrationOptions(userId, userEmail, userName) {
        try {
            const db = (0, connection_1.getDatabase)();
            const usersCollection = db.collection('users');
            const challengesCollection = db.collection('passkey_challenges');
            // Get user's existing passkeys
            const user = await usersCollection.findOne({ _id: new mongodb_1.ObjectId(userId) });
            if (!user) {
                throw new Error('User not found');
            }
            const userPasskeys = user.passkeys || [];
            const excludeCredentials = userPasskeys.map((passkey) => ({
                id: new Uint8Array(Buffer.from(passkey.credentialId, 'base64url')),
                type: 'public-key',
            }));
            const opts = {
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
            const options = await (0, server_1.generateRegistrationOptions)(opts);
            // Store challenge for verification
            const challengeDoc = {
                userId,
                challenge: options.challenge,
                type: 'registration',
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            };
            await challengesCollection.insertOne(challengeDoc);
            return options;
        }
        catch (error) {
            console.error('Generate registration options error:', error);
            throw error;
        }
    },
    // Verify passkey registration using SimpleWebAuthn
    async verifyRegistrationResponse(userId, response, friendlyName) {
        try {
            const db = (0, connection_1.getDatabase)();
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
            const opts = {
                response,
                expectedChallenge: challengeDoc.challenge,
                expectedOrigin: ORIGIN,
                expectedRPID: RP_ID,
                requireUserVerification: false,
            };
            const verification = await (0, server_1.verifyRegistrationResponse)(opts);
            if (!verification.verified || !verification.registrationInfo) {
                return {
                    verified: false,
                    error: 'Passkey registration verification failed',
                };
            }
            // Store the passkey
            const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
            const newPasskey = {
                credentialId: credential.id,
                publicKey: Buffer.from(credential.publicKey).toString('base64'),
                friendlyName: friendlyName || 'Passkey Device',
                counter: credential.counter,
                createdAt: new Date(),
                deviceType: credentialDeviceType === 'multiDevice' ? 'cross-platform' : 'platform',
            };
            // Add passkey to user
            await usersCollection.updateOne({ _id: new mongodb_1.ObjectId(userId) }, {
                $push: { passkeys: newPasskey },
                $set: {
                    updatedAt: new Date(),
                    isEmailVerified: true,
                },
            });
            // Clean up challenge
            await challengesCollection.deleteOne({ _id: challengeDoc._id });
            return {
                verified: true,
                registrationInfo: verification.registrationInfo,
            };
        }
        catch (error) {
            console.error('Verify registration response error:', error);
            return {
                verified: false,
                error: error instanceof Error ? error.message : 'Registration verification failed',
            };
        }
    },
    // Generate passkey authentication options using SimpleWebAuthn
    async generateAuthenticationOptions(userEmail) {
        try {
            const db = (0, connection_1.getDatabase)();
            const challengesCollection = db.collection('passkey_challenges');
            let allowCredentials = [];
            // If user email is provided, get their specific passkeys
            if (userEmail) {
                const usersCollection = db.collection('users');
                const user = await usersCollection.findOne({ email: userEmail.toLowerCase() });
                if (user && user.passkeys) {
                    allowCredentials = user.passkeys.map((passkey) => ({
                        id: passkey.credentialId,
                        type: 'public-key',
                    }));
                }
            }
            const opts = {
                timeout: 60000,
                allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
                userVerification: 'preferred',
                rpID: RP_ID,
            };
            const options = await (0, server_1.generateAuthenticationOptions)(opts);
            // Store challenge for verification
            const challengeDoc = {
                challenge: options.challenge,
                type: 'authentication',
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            };
            await challengesCollection.insertOne(challengeDoc);
            return options;
        }
        catch (error) {
            console.error('Generate authentication options error:', error);
            throw error;
        }
    },
    // Verify passkey authentication using SimpleWebAuthn
    async verifyAuthenticationResponse(response) {
        try {
            const db = (0, connection_1.getDatabase)();
            const usersCollection = db.collection('users');
            const challengesCollection = db.collection('passkey_challenges');
            // Extract challenge from client data
            let clientChallenge;
            try {
                const clientDataJSON = JSON.parse(Buffer.from(response.response.clientDataJSON, 'base64').toString());
                clientChallenge = clientDataJSON.challenge;
            }
            catch (error) {
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
            const passkey = user.passkeys?.find((p) => p.credentialId === credentialId);
            if (!passkey) {
                return {
                    verified: false,
                    error: 'Passkey not found',
                };
            }
            const opts = {
                response,
                expectedChallenge: challengeDoc.challenge,
                expectedOrigin: ORIGIN,
                expectedRPID: RP_ID,
                credential: {
                    id: passkey.credentialId,
                    publicKey: new Uint8Array(Buffer.from(passkey.publicKey, 'base64')),
                    counter: passkey.counter,
                },
                requireUserVerification: false,
            };
            const verification = await (0, server_1.verifyAuthenticationResponse)(opts);
            if (!verification.verified) {
                return {
                    verified: false,
                    error: 'Passkey authentication verification failed',
                };
            }
            // Update counter and last used
            await usersCollection.updateOne({
                _id: user._id,
                'passkeys.credentialId': credentialId,
            }, {
                $set: {
                    lastLoginAt: new Date(),
                    updatedAt: new Date(),
                    'passkeys.$.lastUsed': new Date(),
                    'passkeys.$.counter': verification.authenticationInfo.newCounter,
                },
            });
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
        }
        catch (error) {
            console.error('Verify authentication response error:', error);
            return {
                verified: false,
                error: error instanceof Error ? error.message : 'Authentication verification failed',
            };
        }
    },
    // Get user's passkeys (without sensitive data)
    async getUserPasskeys(userId) {
        try {
            const db = (0, connection_1.getDatabase)();
            const usersCollection = db.collection('users');
            const user = await usersCollection.findOne({ _id: new mongodb_1.ObjectId(userId) });
            if (!user || !user.passkeys) {
                return [];
            }
            // Return passkeys without sensitive data
            return user.passkeys.map((passkey) => ({
                credentialId: passkey.credentialId,
                publicKey: '', // Don't expose
                friendlyName: passkey.friendlyName,
                counter: 0, // Don't expose
                createdAt: passkey.createdAt,
                lastUsed: passkey.lastUsed,
                deviceType: passkey.deviceType,
                userAgent: passkey.userAgent,
            }));
        }
        catch (error) {
            console.error('Get user passkeys error:', error);
            return [];
        }
    },
    // Delete a passkey
    async deletePasskey(userId, credentialId) {
        try {
            const db = (0, connection_1.getDatabase)();
            const usersCollection = db.collection('users');
            const result = await usersCollection.updateOne({ _id: new mongodb_1.ObjectId(userId) }, {
                $pull: { passkeys: { credentialId } },
                $set: { updatedAt: new Date() },
            });
            if (result.modifiedCount === 0) {
                return {
                    success: false,
                    error: 'Passkey not found',
                };
            }
            return { success: true };
        }
        catch (error) {
            console.error('Delete passkey error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete passkey',
            };
        }
    },
};
//# sourceMappingURL=webauthnService.js.map