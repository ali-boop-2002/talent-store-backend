import prisma from "../config/db";
import { Request, Response } from "express";
import { User } from "@prisma/client";
import z from "zod";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}
const sendMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

const sendMessage = async (req: AuthRequest, res: Response) => {
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
    const { id } = req.user as User;

    const sender = await prisma.user.findUnique({
      where: { id },
    });
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    const newMessage = await prisma.message.create({
      data: {
        message,
        receiverId,
        senderName: sender?.name as string,
        receiverName: receiver?.name as string,

        senderId: id,
      },
    });
    res.status(201).json({ message: "Message sent successfully", newMessage });
  } catch (error) {
    res.status(500).json({ message: "Error sending message", error });
  }
};

const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.user as User;
    const { senderId } = req.params;
    if (!senderId) {
      return res.status(400).json({ message: "Sender ID is required" });
    }
    if (senderId === id) {
      return res
        .status(400)
        .json({ message: "You cannot get messages with yourself" });
    }
    const conversation = await prisma.message.findMany({
      where: {
        receiverId: id,
        senderId: senderId as string,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });
    res.status(200).json({ conversation });
  } catch (error) {
    res.status(500).json({ message: "Error getting messages", error });
  }
};
const getAllSenders = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.user as User;
    const senders = await prisma.message.findMany({
      where: { receiverId: id },
      select: {
        sender: true,
      },
      distinct: ["senderId"],
    });
    res.status(200).json({ senders });
  } catch (error) {
    res.status(500).json({ message: "Error getting all senders", error });
  }
};

const getAllMessagesFromSender = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.user as User;
    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const { senderId } = req.params;
    if (!senderId) {
      return res.status(400).json({ message: "Sender ID is required" });
    }
    const messages = await prisma.message.findMany({
      where: { senderId: senderId as string, receiverId: id },
      include: {
        sender: true,
        receiver: true,
      },
    });
    res.status(200).json({ messages });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting all messages from sender", error });
  }
};

const getAllMessagesInConversation = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.user as User;
    const { senderId } = req.params;
    if (!senderId) {
      return res.status(400).json({ message: "Sender ID is required" });
    }
    const messages = await prisma.message.findMany({
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
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting all messages in conversation", error });
  }
};
// const getMessages = async (req: Request, res: Response) => {
//   const { id } = req.user;
// };

export {
  sendMessage,
  getMessages,
  getAllSenders,
  getAllMessagesFromSender,
  getAllMessagesInConversation,
};
