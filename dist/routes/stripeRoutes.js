"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stripeController_1 = require("../controllers/stripeController");
const auth_1 = require("../middleware/auth");
const stripePaymentController_1 = require("../controllers/stripePaymentController");
const router = express_1.default.Router();
router.post("/create-account", auth_1.authenticateToken, (0, auth_1.requireRole)(["TALENT"]), stripeController_1.createStripeAccount);
router.post("/create-link", auth_1.authenticateToken, (0, auth_1.requireRole)(["TALENT"]), stripeController_1.createStripeLink);
router.get("/check-onboarding-status/:userId", auth_1.authenticateToken, (0, auth_1.requireRole)(["TALENT"]), stripeController_1.checkOnboardingStatus);
router.post("/create-payment-intent", auth_1.authenticateToken, stripePaymentController_1.createStripePaymentIntent);
router.get("/get-order-details/:orderId", auth_1.authenticateToken, stripePaymentController_1.getOrderDetails);
router.post("/create-setup-intent", auth_1.authenticateToken, stripePaymentController_1.createSetupIntent);
router.post("/create-subscription", auth_1.authenticateToken, (0, auth_1.requireRole)(["TALENT"]), stripeController_1.createStripeSubscription);
router.get("/check-subscription-status", auth_1.authenticateToken, (0, auth_1.requireRole)(["TALENT"]), stripeController_1.checkSubscriptionStatus);
router.post("/cancel-subscription", auth_1.authenticateToken, (0, auth_1.requireRole)(["TALENT"]), stripeController_1.cancelStripeSubscription);
// router.post(
//   "/update-subscription",
//   authenticateToken,
//   requireRole(["TALENT"]),
//   upgradeStripeSubscription
// );
router.get("/get-payment-methods", auth_1.authenticateToken, (0, auth_1.requireRole)(["TALENT"]), stripeController_1.getPaymentMethods);
router.post("/update-subscription-with-payment-method-id", auth_1.authenticateToken, (0, auth_1.requireRole)(["TALENT"]), stripeController_1.updateStripeSubscriptionWithPaymentMethodId);
// router.post("/webhook", bodyParser.raw({ type: "application/json" }), webhook);
exports.default = router;
//# sourceMappingURL=stripeRoutes.js.map