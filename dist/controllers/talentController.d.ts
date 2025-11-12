import { Request, Response } from "express";
declare const findTalent: (req: Request, res: Response) => Promise<void>;
declare const updateTalentProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const findTalentById: (req: Request, res: Response) => Promise<void>;
declare const findTalentBySkill: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const getTalentsByJobId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const uploadPortfolio: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const deletePortfolio: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export { getTalentsByJobId, deletePortfolio, findTalent, findTalentById, findTalentBySkill, updateTalentProfile, uploadPortfolio, };
//# sourceMappingURL=talentController.d.ts.map