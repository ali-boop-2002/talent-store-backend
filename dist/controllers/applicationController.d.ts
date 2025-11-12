import { Request, Response } from "express";
declare const applyForJob: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getApplicationsForTalent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getApplications: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getApplicationByJobId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const updateApplicationStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const withdrawApplication: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export { applyForJob, getApplications, getApplicationByJobId, updateApplicationStatus, getApplicationsForTalent, withdrawApplication, };
//# sourceMappingURL=applicationController.d.ts.map