import { Router } from 'express';
import { authController } from '../controllers';
import { verifyToken } from '../middleware';

const router = Router();

// Public routes (no authentication required)
// POST /api/auth/register - Register new user (step 1: user info)
router.post('/register', authController.register);

// POST /api/auth/passkey/register/begin - Start passkey registration
router.post('/passkey/register/begin', authController.beginPasskeyRegistration);

// POST /api/auth/passkey/register/finish - Complete passkey registration
router.post('/passkey/register/finish', authController.finishPasskeyRegistration);

// POST /api/auth/passkey/authenticate/begin - Start passkey authentication
router.post('/passkey/authenticate/begin', authController.beginPasskeyAuthentication);

// POST /api/auth/passkey/authenticate/finish - Complete passkey authentication
router.post('/passkey/authenticate/finish', authController.finishPasskeyAuthentication);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', authController.refreshToken);

// Protected routes (authentication required)
// GET /api/auth/me - Get current user info
router.get('/me', verifyToken, authController.getCurrentUser);

// GET /api/auth/passkeys - Get user's passkeys
router.get('/passkeys', verifyToken, authController.getPasskeys);

// DELETE /api/auth/passkeys/:credentialId - Delete a passkey
router.delete('/passkeys/:credentialId', verifyToken, authController.deletePasskey);

// POST /api/auth/logout - Logout user
router.post('/logout', verifyToken, authController.logout);

// GET /api/auth/me - Get current user info (requires authentication)
router.get('/me', authController.getCurrentUser);

export default router;
