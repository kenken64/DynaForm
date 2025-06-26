"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const imageRoutes_1 = __importDefault(require("./imageRoutes"));
const formRoutes_1 = __importDefault(require("./formRoutes"));
const formDataRoutes_1 = __importDefault(require("./formDataRoutes"));
const recipientRoutes_1 = __importDefault(require("./recipientRoutes"));
const recipientGroupRoutes_1 = __importDefault(require("./recipientGroupRoutes"));
const publicRoutes_1 = __importDefault(require("./publicRoutes"));
const authRoutes_1 = __importDefault(require("./authRoutes"));
const chatRoutes_1 = __importDefault(require("./chatRoutes"));
const ndi_webhook_1 = __importDefault(require("./ndi-webhook"));
const ndiRoutes_1 = __importDefault(require("./ndiRoutes"));
const router = (0, express_1.Router)();
// Mount all routes under /api prefix for consistency
router.use('/api', imageRoutes_1.default);
router.use('/api/forms', formRoutes_1.default);
router.use('/api/forms-data', formDataRoutes_1.default);
router.use('/api/recipients', recipientRoutes_1.default);
router.use('/api/recipient-groups', recipientGroupRoutes_1.default);
router.use('/api/public', publicRoutes_1.default);
router.use('/api/auth', authRoutes_1.default);
router.use('/api/chat', chatRoutes_1.default);
router.use('/api/ndi-webhook', ndi_webhook_1.default);
router.use('/api/ndi', ndiRoutes_1.default);
// Keep health check at root level for monitoring tools
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map