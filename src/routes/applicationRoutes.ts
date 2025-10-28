import {
  applyForJob,
  getApplications,
  getApplicationByJobId,
  updateApplicationStatus,
  getApplicationsForTalent,
  withdrawApplication,
} from "../controllers/applicationController";
import { authenticateToken, requireRole } from "../middleware/auth";
import express from "express";

const router = express.Router();

router.post("/apply-for-job", authenticateToken, applyForJob);
router.get("/get-applications", authenticateToken, getApplications);
router.get(
  "/get-applications-for-talent",
  authenticateToken,
  requireRole(["TALENT"]),
  getApplicationsForTalent
);
router.get(
  "/get-application-by-job-id/:jobId",
  authenticateToken,
  getApplicationByJobId
);
router.put(
  "/update-application-status/:applicationId",
  authenticateToken,
  requireRole(["CLIENT"]),
  updateApplicationStatus
);
router.put(
  "/withdraw-application/:applicationId",
  authenticateToken,
  requireRole(["TALENT"]),
  withdrawApplication
);
export default router;
