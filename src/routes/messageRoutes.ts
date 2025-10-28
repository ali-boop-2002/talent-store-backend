import express from "express";
import {
  getAllSenders,
  getMessages,
  sendMessage,
  getAllMessagesFromSender,
  getAllMessagesInConversation,
} from "../controllers/messageController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.post("/send-message/:receiverId", authenticateToken, sendMessage);
router.get("/get-messages/:receiverId", authenticateToken, getMessages);
router.get("/get-all-senders", authenticateToken, getAllSenders);
router.get(
  "/get-all-messages-from-sender/:senderId",
  authenticateToken,
  getAllMessagesFromSender
);
router.get(
  "/get-all-messages-in-conversation/:senderId",
  authenticateToken,
  getAllMessagesInConversation
);

export default router;
