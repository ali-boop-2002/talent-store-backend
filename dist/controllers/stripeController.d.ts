import { Request, Response } from "express";
declare const createStripeAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const createStripeLink: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const checkOnboardingStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const createStripeSubscription: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const checkSubscriptionStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const cancelStripeSubscription: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const updateStripeSubscriptionWithPaymentMethodId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const getPaymentMethods: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const addPaymentMethod: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const updateDefaultPaymentMethod: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const removePaymentMethod: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export { getPaymentMethods, addPaymentMethod, updateDefaultPaymentMethod, removePaymentMethod, createStripeAccount, createStripeLink, checkOnboardingStatus, createStripeSubscription, checkSubscriptionStatus, cancelStripeSubscription, updateStripeSubscriptionWithPaymentMethodId, };
//# sourceMappingURL=stripeController.d.ts.map