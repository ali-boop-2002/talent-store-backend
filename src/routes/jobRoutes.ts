import express from "express";
import {
  createJob,
  getAllJobs,
  getJobBasedOnSkills,
  getJobById,
  getJobsByClientId,
  updateJobStatus,
} from "../controllers/jobController";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = express.Router();

// Public routes
router.get("/", getAllJobs);
router.get("/:id", authenticateToken, getJobById);

// Protected routes - only authenticated users can create jobs
router.post("/create", authenticateToken, createJob);
router.post("/api/find-by-skills", getJobBasedOnSkills);
router.get(
  "/api/find-by-client-id/:clientId",
  authenticateToken,
  requireRole(["CLIENT"]),
  getJobsByClientId
);

router.put(
  "/update-job-status/:jobId",
  authenticateToken,
  requireRole(["CLIENT"]),
  updateJobStatus
);
// Admin-only routes (example)
// router.delete("/:id", authenticateToken, requireRole(["ADMIN"]), deleteJob);

export default router;
