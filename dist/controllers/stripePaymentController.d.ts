import { Request, Response } from "express";
declare const createStripePaymentIntent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getOrderDetails: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const createSetupIntent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export { createStripePaymentIntent, getOrderDetails, createSetupIntent };
//# sourceMappingURL=stripePaymentController.d.ts.map