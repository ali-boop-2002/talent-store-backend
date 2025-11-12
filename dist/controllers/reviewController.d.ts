import { Request, Response } from "express";
declare const _default: {
    createReview: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getAllReviewsForTalent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getAllReviewsForContract: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    createClientReview: (req: Request, res: Response) => Promise<void>;
    getClientReviewsForContract: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getAllClientReviews: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
//# sourceMappingURL=reviewController.d.ts.map