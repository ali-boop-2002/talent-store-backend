"use strict";
// make a review controller that will handle the review logic
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../config/db"));
const zod_1 = require("zod");
const reviewSchema = zod_1.z.object({
    talentId: zod_1.z.string(),
    rating: zod_1.z.number(),
    review: zod_1.z.string(),
    jobId: zod_1.z.string(),
    contractId: zod_1.z.string(),
});
const createReview = async (req, res) => {
    console.log("createReview", req.body);
    const userId = req.user?.id;
    try {
        const validatedData = reviewSchema.parse(req.body);
        const alreadyReviewed = await db_1.default.review.findFirst({
            where: {
                jobId: validatedData.jobId,
                userId: userId,
            },
        });
        if (alreadyReviewed) {
            return res
                .status(400)
                .json({ message: "You have already reviewed this job" });
        }
        const newReview = await db_1.default.review.create({
            data: {
                ...validatedData,
                userId: userId,
            },
        });
        res.status(200).json({ newReview });
    }
    catch (error) {
        console.error("Create review error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
// make a function to get all reviews for a talent
const getAllReviewsForTalent = async (req, res) => {
    try {
        const reviews = await db_1.default.review.findMany({
            where: { talentId: req.params.talentId },
        });
        if (!reviews) {
            return res.status(404).json({ message: "No reviews found" });
        }
        const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
        res.status(200).json({ reviews, averageRating });
    }
    catch (error) {
        console.error("Get all reviews for talent error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
// make a function to get all reviews based on the contract id
const getAllReviewsForContract = async (req, res) => {
    try {
        const userId = req.user?.id;
        const reviews = await db_1.default.review.findMany({
            where: {
                contractId: req.params.contractId,
                userId: userId,
            },
        });
        if (!reviews) {
            return res.status(404).json({ message: "No reviews found" });
        }
        const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
        res.status(200).json({ reviews, averageRating });
    }
    catch (error) {
        console.error("Get all reviews for contract error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
const clientReviewSchema = zod_1.z.object({
    rating: zod_1.z.number(),
    review: zod_1.z.string(),
    jobId: zod_1.z.string(),
    contractId: zod_1.z.string(),
    userId: zod_1.z.string(),
});
// note talent id is the user id of the talent and userId is the user id of the client
const createClientReview = async (req, res) => {
    try {
        const userId = req.user?.id;
        const validatedData = clientReviewSchema.parse(req.body);
        const newClientReview = await db_1.default.clientReview.create({
            data: {
                ...validatedData,
                talentId: userId,
            },
        });
        res.status(200).json({ newClientReview });
    }
    catch (error) {
        console.error("Create client review error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
const getClientReviewsForContract = async (req, res) => {
    try {
        const reviews = await db_1.default.clientReview.findMany({
            where: { contractId: req.params.contractId },
        });
        if (!reviews) {
            return res.status(404).json({ message: "No reviews found" });
        }
        if (reviews.length > 0) {
            const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) /
                reviews.length;
            res.status(200).json({ reviews, averageRating });
        }
        else {
            res.status(200).json({ reviews });
        }
    }
    catch (error) {
        console.error("Get client reviews for contract error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
const getAllClientReviews = async (req, res) => {
    try {
        console.log("getAllClientReviews", req.params.clientId);
        if (!req.params.clientId) {
            return res.status(400).json({ message: "Client ID is required" });
        }
        const reviews = await db_1.default.clientReview.findMany({
            where: { userId: req.params.clientId },
            include: {
                talent: true,
            },
        });
        if (!reviews) {
            return res.status(404).json({ message: "No reviews found" });
        }
        console.log("reviews", reviews);
        if (reviews.length > 0) {
            const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) /
                reviews.length;
            res.status(200).json({ reviews, averageRating });
        }
        else {
            res.status(200).json({ reviews });
        }
    }
    catch (error) {
        console.error("Get all client reviews error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
exports.default = {
    createReview,
    getAllReviewsForTalent,
    getAllReviewsForContract,
    createClientReview,
    getClientReviewsForContract,
    getAllClientReviews,
};
//# sourceMappingURL=reviewController.js.map