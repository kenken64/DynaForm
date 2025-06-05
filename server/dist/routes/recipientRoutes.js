"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/recipients - Create a new recipient (requires authentication)
router.post('/', auth_1.verifyToken, controllers_1.recipientController.createRecipient);
// GET /api/recipients - Get user's recipients with pagination and search (requires authentication)
router.get('/', auth_1.verifyToken, controllers_1.recipientController.getRecipients);
// GET /api/recipients/export - Export recipients as CSV (requires authentication)
router.get('/export', auth_1.verifyToken, controllers_1.recipientController.exportRecipients);
// GET /api/recipients/:id - Get a specific recipient by ID (requires authentication)
router.get('/:id', auth_1.verifyToken, controllers_1.recipientController.getRecipient);
// PUT /api/recipients/:id - Update a recipient by ID (requires authentication)
router.put('/:id', auth_1.verifyToken, controllers_1.recipientController.updateRecipient);
// DELETE /api/recipients/:id - Delete a recipient by ID (requires authentication)
router.delete('/:id', auth_1.verifyToken, controllers_1.recipientController.deleteRecipient);
exports.default = router;
//# sourceMappingURL=recipientRoutes.js.map