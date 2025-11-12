import { Request, Response } from "express";
declare const registerUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const createGig: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const updateUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const getAllUsers: (req: Request, res: Response) => Promise<void>;
declare const getUserById: (req: Request, res: Response) => Promise<void>;
declare const loginUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const logoutUser: (req: Request, res: Response) => Promise<void>;
declare const getUsersBySkills: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const uploadProfilePic: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const getAllSkillsShuffled: (req: Request, res: Response) => Promise<void>;
export { getAllSkillsShuffled, getAllUsers, registerUser, loginUser, logoutUser, updateUser, getUsersBySkills, uploadProfilePic, createGig, getUserById, };
//# sourceMappingURL=userController.d.ts.map