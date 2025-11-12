"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const messageController_1 = require("../controllers/messageController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post("/send-message/:receiverId", auth_1.authenticateToken, messageController_1.sendMessage);
router.get("/get-messages/:receiverId", auth_1.authenticateToken, messageController_1.getMessages);
router.get("/get-all-senders", auth_1.authenticateToken, messageController_1.getAllSenders);
router.get("/get-all-messages-from-sender/:senderId", auth_1.authenticateToken, messageController_1.getAllMessagesFromSender);
router.get("/get-all-messages-in-conversation/:senderId", auth_1.authenticateToken, messageController_1.getAllMessagesInConversation);
exports.default = router;
//# sourceMappingURL=messageRoutes.js.map