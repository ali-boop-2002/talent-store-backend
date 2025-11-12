import { Request, Response } from "express";
declare const getOrdersForTalent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const getOrdersForClient: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export { getOrdersForTalent, getOrdersForClient };
//# sourceMappingURL=orderController.d.ts.map