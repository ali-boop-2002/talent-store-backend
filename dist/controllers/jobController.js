"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateJobStatus = exports.getJobsByClientId = exports.getJobBasedOnSkills = exports.getAllJobs = exports.getJobById = exports.createJob = void 0;
const db_1 = __importDefault(require("../config/db"));
const zod_1 = require("zod");
const createJobSchema = zod_1.z.object({
    clientId: zod_1.z.string().min(1, "Client ID is required"),
    title: zod_1.z.string().min(1, "Title is required"),
    description: zod_1.z.string().min(1, "Description is required"),
    category: zod_1.z.string().min(1, "Category is required"),
    location: zod_1.z
        .string()
        .nullish()
        .transform((val) => val ?? null),
    skills: zod_1.z.array(zod_1.z.string()).min(1, "Skills are required"),
    timeline: zod_1.z.string().min(1, "Timeline is required"),
    paymentType: zod_1.z.enum(["HOURLY", "FIXED"]),
    budget: zod_1.z.number().min(1, "Budget is required"),
    status: zod_1.z
        .enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
        .default("OPEN"),
});
const createJob = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const validatedData = createJobSchema.parse({
            clientId: userId,
            ...req.body,
        });
        const job = await db_1.default.job.create({ data: validatedData });
        res.status(201).json({
            message: "Job created successfully",
            job: job,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error creating job", error });
    }
};
exports.createJob = createJob;
const getJobById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Job ID is required" });
        }
        const job = await db_1.default.job.findUnique({
            where: { id: id },
            include: { applications: true },
        });
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }
        res.status(200).json({
            message: "Job fetched successfully",
            job: job,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching job" });
    }
};
exports.getJobById = getJobById;
const getAllJobs = async (req, res) => {
    try {
        const page = req.query.page;
        const limit = req.query.limit;
        const offset = (Number(page) - 1) * Number(limit);
        const jobs = await db_1.default.job.findMany({
            skip: offset,
            take: Number(limit),
            orderBy: { createdAt: "desc" },
            include: {
                applications: true,
            },
        });
        // if (jobs.length < 1) {
        //   const allJobs = await prisma.job.findMany({});
        //   res.status(200).json({ allJobs });
        // }
        res.status(200).json({ jobs });
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching all jobs" });
    }
};
exports.getAllJobs = getAllJobs;
const getJobBasedOnSkills = async (req, res) => {
    try {
        const page = req.query.page || "1";
        const limit = req.query.limit || "20";
        const offset = (Number(page) - 1) * Number(limit);
        if (!req.body.skills || !Array.isArray(req.body.skills)) {
            return res.status(400).json({ message: "Skills array is required" });
        }
        const skills = req.body.skills;
        const jobs = await db_1.default.job.findMany({
            where: {
                OR: skills.map((skill) => ({
                    category: {
                        contains: skill,
                        mode: "insensitive",
                    },
                })),
            },
            include: {
                applications: true,
            },
            skip: offset,
            take: Number(limit),
            orderBy: {
                createdAt: "desc",
            },
        });
        if (jobs.length === 0) {
            return res.status(200).json({ jobs: [], count: 0 });
        }
        res.status(200).json({ jobs, count: jobs.length });
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching jobs by skills", error });
    }
};
exports.getJobBasedOnSkills = getJobBasedOnSkills;
const getJobsByClientId = async (req, res) => {
    try {
        const { clientId } = req.params;
        if (!clientId) {
            return res.status(400).json({ message: "Client ID is required" });
        }
        const jobs = await db_1.default.job.findMany({
            where: { clientId: clientId },
            include: { applications: true },
        });
        res.status(200).json({ jobs });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Error fetching jobs by client ID", error });
    }
};
exports.getJobsByClientId = getJobsByClientId;
const updateJobStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { jobId } = req.params;
        if (!jobId || !status) {
            return res
                .status(400)
                .json({ message: "Job ID and status are required" });
        }
        const job = await db_1.default.job.update({
            where: { id: jobId },
            data: { status },
        });
        res.status(200).json({ job });
    }
    catch (error) {
        res.status(500).json({ message: "Error updating job status", error });
    }
};
exports.updateJobStatus = updateJobStatus;
//# sourceMappingURL=jobController.js.map