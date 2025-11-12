import { Request, Response } from "express";
declare const createJob: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const getJobById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const getAllJobs: (req: Request, res: Response) => Promise<void>;
declare const getJobBasedOnSkills: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const getJobsByClientId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const updateJobStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export { createJob, getJobById, getAllJobs, getJobBasedOnSkills, getJobsByClientId, updateJobStatus, };
//# sourceMappingURL=jobController.d.ts.map