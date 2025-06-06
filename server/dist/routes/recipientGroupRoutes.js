"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recipientGroupController_1 = require("../controllers/recipientGroupController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/recipient-groups - Create a new recipient group (requires authentication)
router.post('/', auth_1.verifyToken, recipientGroupController_1.recipientGroupController.createRecipientGroup);
// GET /api/recipient-groups - Get user's recipient groups with pagination and search (requires authentication)
router.get('/', auth_1.verifyToken, recipientGroupController_1.recipientGroupController.getRecipientGroups);
// GET /api/recipient-groups/export - Export recipient groups as CSV (requires authentication)
router.get('/export', auth_1.verifyToken, recipientGroupController_1.recipientGroupController.exportRecipientGroups);
// GET /api/recipient-groups/search - Search groups by alias (requires authentication)
router.get('/search', auth_1.verifyToken, recipientGroupController_1.recipientGroupController.searchByAlias);
// GET /api/recipient-groups/with-recipients - Get all groups with populated recipient details (requires authentication)
router.get('/with-recipients', auth_1.verifyToken, recipientGroupController_1.recipientGroupController.getGroupsWithRecipients);
// GET /api/recipient-groups/:id - Get a specific recipient group by ID (requires authentication)
router.get('/:id', auth_1.verifyToken, recipientGroupController_1.recipientGroupController.getRecipientGroup);
// PUT /api/recipient-groups/:id - Update a recipient group by ID (requires authentication)
router.put('/:id', auth_1.verifyToken, recipientGroupController_1.recipientGroupController.updateRecipientGroup);
// DELETE /api/recipient-groups/:id - Delete a recipient group by ID (requires authentication)
router.delete('/:id', auth_1.verifyToken, recipientGroupController_1.recipientGroupController.deleteRecipientGroup);
exports.default = router;
//# sourceMappingURL=recipientGroupRoutes.js.map