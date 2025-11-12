"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMessagesInConversation = exports.getAllMessagesFromSender = exports.getAllSenders = exports.getMessages = exports.sendMessage = void 0;
const db_1 = __importDefault(require("../config/db"));
const zod_1 = __importDefault(require("zod"));
const sendMessageSchema = zod_1.default.object({
    message: zod_1.default.string().min(1, "Message is required"),
});
const sendMessage = async (req, res) => {
    try {
        const { message } = sendMessageSchema.parse(req.body);
        const { receiverId } = req.params;
        if (!receiverId) {
            return res.status(400).json({ message: "Receiver ID is required" });
        }
        if (receiverId === req.user?.id) {
            return res
                .status(400)
                .json({ message: "You cannot send a message to yourself" });
        }
        const id = req.user?.id;
        if (!id) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const sender = await db_1.default.user.findUnique({
            where: { id },
        });
        const receiver = await db_1.default.user.findUnique({
            where: { id: receiverId },
        });
        const newMessage = await db_1.default.message.create({
            data: {
                message,
                receiverId,
                senderName: sender?.name,
                receiverName: receiver?.name,
                senderId: id,
            },
        });
        res.status(201).json({ message: "Message sent successfully", newMessage });
    }
    catch (error) {
        res.status(500).json({ message: "Error sending message", error });
    }
};
exports.sendMessage = sendMessage;
const getMessages = async (req, res) => {
    try {
        const id = req.user?.id;
        if (!id) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { senderId } = req.params;
        if (!senderId) {
            return res.status(400).json({ message: "Sender ID is required" });
        }
        if (senderId === id) {
            return res
                .status(400)
                .json({ message: "You cannot get messages with yourself" });
        }
        const conversation = await db_1.default.message.findMany({
            where: {
                receiverId: id,
                senderId: senderId,
            },
            include: {
                sender: true,
                receiver: true,
            },
        });
        res.status(200).json({ conversation });
    }
    catch (error) {
        res.status(500).json({ message: "Error getting messages", error });
    }
};
exports.getMessages = getMessages;
const getAllSenders = async (req, res) => {
    try {
        const id = req.user?.id;
        if (!id) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const senders = await db_1.default.message.findMany({
            where: { receiverId: id },
            select: {
                sender: true,
            },
            distinct: ["senderId"],
        });
        res.status(200).json({ senders });
    }
    catch (error) {
        res.status(500).json({ message: "Error getting all senders", error });
    }
};
exports.getAllSenders = getAllSenders;
const getAllMessagesFromSender = async (req, res) => {
    try {
        const id = req.user?.id;
        if (!id) {
            return res.status(400).json({ message: "User ID is required" });
        }
        const { senderId } = req.params;
        if (!senderId) {
            return res.status(400).json({ message: "Sender ID is required" });
        }
        const messages = await db_1.default.message.findMany({
            where: { senderId: senderId, receiverId: id },
            include: {
                sender: true,
                receiver: true,
            },
        });
        res.status(200).json({ messages });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Error getting all messages from sender", error });
    }
};
exports.getAllMessagesFromSender = getAllMessagesFromSender;
const getAllMessagesInConversation = async (req, res) => {
    try {
        const id = req.user?.id;
        if (!id) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { senderId } = req.params;
        if (!senderId) {
            return res.status(400).json({ message: "Sender ID is required" });
        }
        const messages = await db_1.default.message.findMany({
            where: {
                OR: [
                    { receiverId: id, senderId: senderId },
                    { receiverId: senderId, senderId: id },
                ],
            },
            include: {
                sender: true,
                receiver: true,
            },
            orderBy: {
                createdAt: "asc",
            },
        });
        res.status(200).json({ messages });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Error getting all messages in conversation", error });
    }
};
exports.getAllMessagesInConversation = getAllMessagesInConversation;
//# sourceMappingURL=messageController.js.map