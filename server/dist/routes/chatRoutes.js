"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatController_1 = require("../controllers/chatController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Apply authentication middleware to all chat routes
router.use(auth_1.verifyToken);
// POST /api/chat/ask-dynaform - Send a message to the chat service
router.post('/ask-dynaform', chatController_1.chatController.sendMessage);
// GET /api/chat/health - Check chat service health
router.get('/health', chatController_1.chatController.healthCheck);
exports.default = router;
//# sourceMappingURL=chatRoutes.js.map