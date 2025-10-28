import prisma from "../config/db";

import { Request, Response } from "express";

import { z } from "zod";

const createJobSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  location: z
    .string()
    .nullish()
    .transform((val) => val ?? null),
  skills: z.array(z.string()).min(1, "Skills are required"),
  timeline: z.string().min(1, "Timeline is required"),
  paymentType: z.enum(["HOURLY", "FIXED"]),
  budget: z.number().min(1, "Budget is required"),
  status: z
    .enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .default("OPEN"),
});

const createJob = async (req: Request, res: Response) => {
  try {
    const validatedData = createJobSchema.parse({
      clientId: req.user.id as string,
      ...req.body,
    });

    const job = await prisma.job.create({ data: validatedData });

    res.status(201).json({
      message: "Job created successfully",
      job: job,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating job", error });
  }
};

const getJobById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Job ID is required" });
    }
    const job = await prisma.job.findUnique({
      where: { id: id as string },
      include: { applications: true },
    });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.status(200).json({
      message: "Job fetched successfully",
      job: job,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching job" });
  }
};

const getAllJobs = async (req: Request, res: Response) => {
  try {
    const page = req.query.page as string;
    const limit = req.query.limit as string;
    const offset = (Number(page) - 1) * Number(limit);
    const jobs = await prisma.job.findMany({
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
  } catch (error) {
    res.status(500).json({ message: "Error fetching all jobs" });
  }
};

const getJobBasedOnSkills = async (req: Request, res: Response) => {
  try {
    const page = req.query.page || ("1" as string);
    const limit = req.query.limit || ("20" as string);
    const offset = (Number(page) - 1) * Number(limit);
    if (!req.body.skills || !Array.isArray(req.body.skills)) {
      return res.status(400).json({ message: "Skills array is required" });
    }

    const skills = req.body.skills as string[];

    const jobs = await prisma.job.findMany({
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
  } catch (error) {
    res.status(500).json({ message: "Error fetching jobs by skills", error });
  }
};

const getJobsByClientId = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ message: "Client ID is required" });
    }

    const jobs = await prisma.job.findMany({
      where: { clientId: clientId as string },
      include: { applications: true },
    });

    res.status(200).json({ jobs });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching jobs by client ID", error });
  }
};

const updateJobStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const { jobId } = req.params;
    if (!jobId || !status) {
      return res
        .status(400)
        .json({ message: "Job ID and status are required" });
    }
    const job = await prisma.job.update({
      where: { id: jobId },
      data: { status },
    });
    res.status(200).json({ job });
  } catch (error) {
    res.status(500).json({ message: "Error updating job status", error });
  }
};

export {
  createJob,
  getJobById,
  getAllJobs,
  getJobBasedOnSkills,
  getJobsByClientId,
  updateJobStatus,
};
