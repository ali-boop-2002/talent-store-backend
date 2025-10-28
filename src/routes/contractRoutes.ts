import express from "express";
import {
  // createContract,
  getContractsByClientId,
  getContractsByTalentId,
  updateContract,
  updateContractAccepted,
} from "../controllers/contractController";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/auth";

const router = express.Router();

// router.post(
//   "/create",
//   authenticateToken,
//   requireRole(["CLIENT"]),
//   createContract
// );
router.get(
  "/client",
  authenticateToken,
  requireRole(["CLIENT"]),
  getContractsByClientId
);
router.get(
  "/talent",
  authenticateToken,
  requireRole(["TALENT"]),
  getContractsByTalentId
);
router.put("/update/:id", authenticateToken, updateContract);
router.put(
  "/update/accepted/:id",
  authenticateToken,
  requireRole(["TALENT"]),
  updateContractAccepted
);

export default router;
