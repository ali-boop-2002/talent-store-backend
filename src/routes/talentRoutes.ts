import express from "express";
import {
  findTalent,
  findTalentById,
  findTalentBySkill,
  updateTalentProfile,
  uploadPortfolio,
  deletePortfolio,
  getTalentsByJobId,
} from "../controllers/talentController";
import { authenticateToken } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = express.Router();

router.get("/find-talent", findTalent);
router.get("/find-talent/:id", findTalentById);
router.get("/talents/search", findTalentBySkill);
router.put("/update-profile/", authenticateToken, updateTalentProfile);
router.get("/talent-by-job-id/:jobId", authenticateToken, getTalentsByJobId);
router.post(
  "/upload-portfolio",
  authenticateToken,
  upload.any(),
  uploadPortfolio
);

router.delete("/delete-portfolio", authenticateToken, deletePortfolio);

export default router;
