"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// Public routes (no authentication required)
// POST /api/auth/register - Register new user (step 1: user info)
router.post('/register', controllers_1.authController.register);
// POST /api/auth/passkey/register/begin - Start passkey registration
router.post('/passkey/register/begin', controllers_1.authController.beginPasskeyRegistration);
// POST /api/auth/passkey/register/finish - Complete passkey registration
router.post('/passkey/register/finish', controllers_1.authController.finishPasskeyRegistration);
// POST /api/auth/passkey/authenticate/begin - Start passkey authentication
router.post('/passkey/authenticate/begin', controllers_1.authController.beginPasskeyAuthentication);
// POST /api/auth/passkey/authenticate/finish - Complete passkey authentication
router.post('/passkey/authenticate/finish', controllers_1.authController.finishPasskeyAuthentication);
// POST /api/auth/refresh - Refresh access token
router.post('/refresh', controllers_1.authController.refreshToken);
// Protected routes (authentication required)
// GET /api/auth/me - Get current user info
router.get('/me', middleware_1.verifyToken, controllers_1.authController.getCurrentUser);
// GET /api/auth/passkeys - Get user's passkeys
router.get('/passkeys', middleware_1.verifyToken, controllers_1.authController.getPasskeys);
// DELETE /api/auth/passkeys/:credentialId - Delete a passkey
router.delete('/passkeys/:credentialId', middleware_1.verifyToken, controllers_1.authController.deletePasskey);
// POST /api/auth/logout - Logout user
router.post('/logout', middleware_1.verifyToken, controllers_1.authController.logout);
// GET /api/auth/me - Get current user info (requires authentication)
router.get('/me', controllers_1.authController.getCurrentUser);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map