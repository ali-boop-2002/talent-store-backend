import { Request, Response } from "express";
declare const getContractsByClientId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const getContractsByTalentId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const updateContract: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const updateContractAccepted: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export { getContractsByClientId, getContractsByTalentId, updateContract, updateContractAccepted, };
//# sourceMappingURL=contractController.d.ts.map