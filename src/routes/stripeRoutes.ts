import express from "express";
import {
  createStripeAccount,
  createStripeLink,
  checkOnboardingStatus,
  createStripeSubscription,
  checkSubscriptionStatus,
  cancelStripeSubscription,
  // upgradeStripeSubscription,
  getPaymentMethods,
  updateStripeSubscriptionWithPaymentMethodId,
} from "../controllers/stripeController";
import { authenticateToken, requireRole } from "../middleware/auth";
import {
  createStripePaymentIntent,
  getOrderDetails,
  createSetupIntent,
} from "../controllers/stripePaymentController";
import { webhook } from "../controllers/webhookController";
import bodyParser from "body-parser";

const router = express.Router();

router.post(
  "/create-account",
  authenticateToken,
  requireRole(["TALENT"]),
  createStripeAccount
);
router.post(
  "/create-link",
  authenticateToken,
  requireRole(["TALENT"]),
  createStripeLink
);
router.get(
  "/check-onboarding-status/:userId",
  authenticateToken,
  requireRole(["TALENT"]),
  checkOnboardingStatus
);
router.post(
  "/create-payment-intent",
  authenticateToken,

  createStripePaymentIntent
);

router.get(
  "/get-order-details/:orderId",
  authenticateToken,

  getOrderDetails
);

router.post("/create-setup-intent", authenticateToken, createSetupIntent);

router.post(
  "/create-subscription",
  authenticateToken,
  requireRole(["TALENT"]),
  createStripeSubscription
);
router.get(
  "/check-subscription-status",
  authenticateToken,
  requireRole(["TALENT"]),
  checkSubscriptionStatus
);

router.post(
  "/cancel-subscription",
  authenticateToken,
  requireRole(["TALENT"]),
  cancelStripeSubscription
);

// router.post(
//   "/update-subscription",
//   authenticateToken,
//   requireRole(["TALENT"]),
//   upgradeStripeSubscription
// );

router.get(
  "/get-payment-methods",
  authenticateToken,
  requireRole(["TALENT"]),
  getPaymentMethods
);

router.post(
  "/update-subscription-with-payment-method-id",
  authenticateToken,
  requireRole(["TALENT"]),
  updateStripeSubscriptionWithPaymentMethodId
);
// router.post("/webhook", bodyParser.raw({ type: "application/json" }), webhook);
export default router;
