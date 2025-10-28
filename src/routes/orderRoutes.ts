import express from "express";
import {
  getOrdersForClient,
  getOrdersForTalent,
} from "../controllers/orderController";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = express.Router();

router.get(
  "/talent/orders",
  authenticateToken,
  requireRole(["TALENT"]),
  getOrdersForTalent
);

router.get(
  "/client/orders",
  authenticateToken,
  requireRole(["CLIENT"]),
  getOrdersForClient
);
export default router;
