import express from "express";
import reviewController from "../controllers/reviewController";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/auth";

const router = express.Router();

router.post(
  "/createReview",
  authenticateToken,
  requireRole(["CLIENT"]),
  reviewController.createReview
);
router.get(
  "/getAllReviewsForTalent/:talentId",
  authenticateToken,
  requireRole(["TALENT"]),
  reviewController.getAllReviewsForTalent
);
router.get(
  "/getAllReviewsForContract/:contractId",
  authenticateToken,
  requireRole(["CLIENT"]),
  reviewController.getAllReviewsForContract
);
router.post(
  "/createClientReview",
  authenticateToken,
  requireRole(["TALENT"]),
  reviewController.createClientReview
);

router.get(
  "/getClientReviewsForContract/:contractId",
  authenticateToken,
  requireRole(["TALENT"]),
  reviewController.getClientReviewsForContract
);

router.get(
  "/getAllClientReviews/:clientId",

  reviewController.getAllClientReviews
);

export default router;
