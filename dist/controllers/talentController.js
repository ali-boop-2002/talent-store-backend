"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPortfolio = exports.updateTalentProfile = exports.findTalentBySkill = exports.findTalentById = exports.findTalent = exports.deletePortfolio = exports.getTalentsByJobId = void 0;
const zod_1 = require("zod");
const uuid_1 = require("uuid");
const db_1 = __importDefault(require("../config/db"));
const supabase_1 = require("../config/supabase");
const findTalent = async (req, res) => {
    try {
        const talent = await db_1.default.user.findMany({
            where: {
                role: "TALENT",
            },
            select: {
                id: true,
                name: true,
                userProfilePic: true,
                skills: true,
                description: true,
                keyBalance: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
                gigs: true,
            },
        });
        res.status(200).json({ talent });
    }
    catch (error) {
        console.error("Find talent error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
exports.findTalent = findTalent;
const userProfileSchema = zod_1.z.object({
    name: zod_1.z.string().optional().nullish(),
    email: zod_1.z.string().optional().nullish(),
    phone: zod_1.z.string().optional().nullish(),
    location: zod_1.z.string().optional().nullish(),
    Bio: zod_1.z.string().optional().nullish(),
    availabilty: zod_1.z.string().optional().nullish(),
    portfolio: zod_1.z.any().optional().nullish(),
});
const updateTalentProfile = async (req, res) => {
    try {
        const validatedData = userProfileSchema.parse(req.body);
        const id = req.user?.id;
        if (!id) {
            return res.status(400).json({ message: "ID is required" });
        }
        const findTalent = await db_1.default.user.findUnique({
            where: { id },
        });
        if (!findTalent) {
            return res.status(400).json({ message: "Talent not found" });
        }
        // Filter out undefined values - Prisma doesn't accept undefined in updates
        const dataToUpdate = Object.fromEntries(Object.entries(validatedData).filter(([, value]) => value !== undefined));
        const talent = await db_1.default.user.update({
            where: { id },
            data: dataToUpdate,
        });
        res.status(200).json({ talent });
    }
    catch (error) {
        console.error("Update talent profile error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
exports.updateTalentProfile = updateTalentProfile;
const findTalentById = async (req, res) => {
    try {
        const talent = await db_1.default.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                location: true,
                Bio: true,
                description: true,
                availabilty: true,
                portfolio: true,
                userProfilePic: true,
                skills: true,
                gigs: true,
                onboardingComplete: true,
                talentReviews: true,
            },
        });
        if (talent?.talentReviews?.length && talent?.talentReviews?.length > 0) {
            const user = await db_1.default.user.findUnique({
                where: { id: talent?.talentReviews?.[0]?.userId },
                select: {
                    name: true,
                },
            });
            const averageRating = talent?.talentReviews?.reduce((acc, review) => acc + review?.rating, 0) / (talent?.talentReviews?.length || 0);
            res.status(200).json({ talent, averageRating, user });
        }
        else {
            res.status(200).json({ talent });
        }
    }
    catch (error) {
        console.error("Find talent by id error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
exports.findTalentById = findTalentById;
const findTalentBySkill = async (req, res) => {
    try {
        const { skills } = req.query;
        if (!skills) {
            return res.status(400).json({
                error: "Skills parameter is required",
                message: "Please provide skills as a query parameter",
            });
        }
        // Fix: Handle both array and string cases, then split by comma
        let skillsArray;
        if (Array.isArray(skills)) {
            // If it's an array, join and split (handles your current case)
            skillsArray = skills
                .join(",")
                .split(",")
                .map((skill) => skill.trim());
        }
        else {
            // If it's a string, split by comma
            skillsArray = skills.split(",").map((skill) => skill.trim());
        }
        // Should now log: ['kitchen renovation', 'Web Development', 'carpentry', 'furniture design']
        const talent = await db_1.default.user.findMany({
            where: {
                role: "TALENT",
                skills: {
                    hasSome: skillsArray, // Now this will work correctly
                },
            },
            select: {
                id: true,
                name: true,
                userProfilePic: true,
                skills: true,
                description: true,
                keyBalance: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
                gigs: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.status(200).json({
            message: "Talents found",
            count: talent.length,
            skills: skillsArray,
            talent: talent,
        });
    }
    catch (error) {
        console.error("Find talent by skills error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
exports.findTalentBySkill = findTalentBySkill;
const getTalentsByJobId = async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!jobId)
            return res.status(400).json({ message: "Job ID is required" });
        // 1) get all applications for the job (only need talentId)
        const applications = await db_1.default.application.findMany({
            where: { jobId },
            select: { talentId: true },
        });
        if (!applications || applications.length === 0) {
            return res
                .status(404)
                .json({ message: "No applications found for this job" });
        }
        // 2) unique talent ids
        const talentIds = Array.from(new Set(applications.map((a) => a.talentId)));
        // 3) fetch the users (select only safe fields)
        const talents = await db_1.default.user.findMany({
            where: { id: { in: talentIds } },
            select: {
                id: true,
                name: true,
                email: true,
                // do NOT select password or any sensitive fields
            },
        });
        if (!talents || talents.length === 0) {
            return res.status(404).json({ message: "No talents found for this job" });
        }
        return res.status(200).json({ talents });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};
exports.getTalentsByJobId = getTalentsByJobId;
const uploadPortfolio = async (req, res) => {
    try {
        const files = req.files;
        const userId = req.user?.id;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }
        const uploadPromises = files.map(async (file) => {
            // Generate unique filename
            const fileExt = file.originalname.split(".").pop();
            const fileName = `${userId}/${(0, uuid_1.v4)()}.${fileExt}`;
            // Upload to Supabase Storage
            const { data, error } = await supabase_1.supabase.storage
                .from(supabase_1.PORTFOLIO_BUCKET)
                .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });
            if (error) {
                console.error("Upload error:", error);
                throw error;
            }
            // Get public URL
            const { data: publicData } = supabase_1.supabase.storage
                .from(supabase_1.PORTFOLIO_BUCKET)
                .getPublicUrl(fileName);
            return {
                fileName: file.originalname,
                url: publicData.publicUrl,
                size: file.size,
            };
        });
        // Wait for all uploads to complete
        const uploadResults = await Promise.all(uploadPromises);
        // Get existing portfolio URLs
        const currentUser = await db_1.default.user.findUnique({
            where: { id: userId },
            select: { portfolio: true },
        });
        // Combine existing URLs with new ones
        const newUrls = uploadResults.map((result) => result.url);
        const existingUrls = currentUser?.portfolio || [];
        const combinedUrls = [...existingUrls, ...newUrls];
        // Update user's portfolio URLs in database
        const updatedUser = await db_1.default.user.update({
            where: { id: userId },
            data: {
                portfolio: combinedUrls, // Append new URLs to existing ones
            },
        });
        res.json({
            message: "Portfolio uploaded successfully",
            files: uploadResults,
            count: uploadResults.length,
            totalPortfolioItems: combinedUrls.length,
        });
    }
    catch (error) {
        console.error("Portfolio upload error:", error);
        res.status(500).json({ error: "Failed to upload portfolio" });
    }
};
exports.uploadPortfolio = uploadPortfolio;
const deletePortfolio = async (req, res) => {
    try {
        const { portfolioUrls } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!portfolioUrls) {
            return res.status(400).json({ error: "Portfolio URL is required" });
        }
        // Extract file path from URL
        const filePath = portfolioUrls.split(`/${supabase_1.PORTFOLIO_BUCKET}/`)[1];
        if (!filePath) {
            return res.status(400).json({ error: "Invalid portfolio URL" });
        }
        // Delete from Supabase Storage
        const { error: storageError } = await supabase_1.supabase.storage
            .from(supabase_1.PORTFOLIO_BUCKET)
            .remove([filePath]);
        if (storageError) {
            console.error("Storage deletion error:", storageError);
            throw storageError;
        }
        // Get current user's portfolio
        const currentUser = await db_1.default.user.findUnique({
            where: { id: userId },
            select: { portfolio: true },
        });
        // Remove the URL from the portfolio array
        const updatedPortfolio = (currentUser?.portfolio || []).filter((url) => url !== portfolioUrls);
        // Update database
        await db_1.default.user.update({
            where: { id: userId },
            data: {
                portfolio: updatedPortfolio,
            },
        });
        res.json({
            message: "Portfolio item deleted successfully",
            remainingItems: updatedPortfolio.length,
        });
    }
    catch (error) {
        console.error("Portfolio deletion error:", error);
        res.status(500).json({ error: "Failed to delete portfolio item" });
    }
};
exports.deletePortfolio = deletePortfolio;
//# sourceMappingURL=talentController.js.map