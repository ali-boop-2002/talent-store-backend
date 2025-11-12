import { Request, Response } from "express";
import prisma from "../config/db";
import { z } from "zod";

const applyForJobSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),

  coverLetter: z.string().min(1, "Cover letter is required"),
  proposedRate: z.number().min(1, "Proposed rate is required"),
  timeline: z.string().min(1, "Timeline is required"),
  keysUsed: z.number().min(1, "Keys used is required"),
});

const applyForJob = async (req: Request, res: Response) => {
  try {
    const { jobId, coverLetter, proposedRate, timeline, keysUsed } =
      applyForJobSchema.parse(req.body);
    if (!jobId || !coverLetter || !proposedRate || !timeline) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        keyBalance: true,
        role: true,
      },
    });

    const appliedJobs = await prisma.application.findMany({
      where: {
        jobId,
        talentId: req.user.id,
      },
    });

    if (appliedJobs.length > 0) {
      return res
        .status(409)
        .json({ message: "You have already applied for this job" });
    }
    if (keysUsed < 5) {
      return res
        .status(400)
        .json({ message: "minimum 5 keys are required to apply for a job" });
    }

    if ((user?.keyBalance ?? 0) < keysUsed || user?.role !== "TALENT") {
      return res.status(400).json({ message: "Insufficient keys" });
    }
    await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        keyBalance: user?.keyBalance - keysUsed,
      },
    });
    // const updatedUser = await prisma.user.findUnique({
    //   where: {
    //     id: req.user.id,
    //   },
    //   select: {
    //     keyBalance: updatedUser?.keyBalance - keysUsed,
    //   },
    // });

    const application = await prisma.application.create({
      data: {
        jobId,
        talentId: req.user.id,
        coverLetter,
        proposedRate,
        timeline,
        keysUsed,
      },
    });

    return res
      .status(200)
      .json({ message: "Application created successfully", application });
  } catch (error) {
    console.error("Error creating application:", error);
    return res
      .status(500)
      .json({ message: "Error creating application", error });
  }
};

const getApplicationsForTalent = async (req: Request, res: Response) => {
  try {
    const talentId = req.user?.id ?? "";
    if (!talentId) {
      return res.status(400).json({ message: "Talent ID is required" });
    }
    const applications = await prisma.application.findMany({
      where: { talentId: req.user?.id ?? "" },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const jobs = await prisma.job.findMany({
      where: {
        id: { in: applications.map((application) => application.jobId) },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    return res.status(200).json({ applications, jobs });
  } catch (error) {
    console.error("Error getting applications for talent:", error);
    return res
      .status(500)
      .json({ message: "Error getting applications for talent", error });
  }
};

const getApplications = async (req: Request, res: Response) => {
  try {
    const applications = await prisma.application.findMany();
    return res.status(200).json({ applications });
  } catch (error) {
    console.error("Error getting applications:", error);
    return res
      .status(500)
      .json({ message: "Error getting applications", error });
  }
};

const getApplicationByJobId = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required" });
    }
    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        talent: true,
      },
      orderBy: {
        keysUsed: "desc",
      },
    });
    return res.status(200).json({ applications });
  } catch (error) {
    console.error("Error getting applications:", error);
    return res
      .status(500)
      .json({ message: "Error getting applications", error });
  }
};

const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const { applicationId } = req.params;

    if (!applicationId || !status) {
      return res
        .status(400)
        .json({ message: "Application ID and status are required" });
    }
    const existingApplication = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!existingApplication) {
      return res.status(404).json({ message: "Application not found" });
    }
    if (existingApplication.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Application is already updated" });
    }
    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });
    return res.status(200).json({ application });
  } catch (error) {
    console.error("Error updating application status:", error);
    return res
      .status(500)
      .json({ message: "Error updating application status", error });
  }
};

const withdrawApplication = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }
    const application = await prisma.application.update({
      where: { id: applicationId, talentId: req.user?.id ?? "" },
      data: { status: "WITHDRAWN" },
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    return res.status(200).json({ application });
  } catch (error) {
    console.error("Error withdrawing application:", error);
    return res
      .status(500)
      .json({ message: "Error withdrawing application", error });
  }
};

export {
  applyForJob,
  getApplications,
  getApplicationByJobId,
  updateApplicationStatus,
  getApplicationsForTalent,
  withdrawApplication,
};
