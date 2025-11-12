import { Request, Response } from "express";
declare const sendMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const getMessages: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const getAllSenders: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const getAllMessagesFromSender: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const getAllMessagesInConversation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export { sendMessage, getMessages, getAllSenders, getAllMessagesFromSender, getAllMessagesInConversation, };
//# sourceMappingURL=messageController.d.ts.map