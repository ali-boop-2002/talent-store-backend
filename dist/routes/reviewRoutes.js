"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reviewController_1 = __importDefault(require("../controllers/reviewController"));
const auth_1 = require("../middleware/auth");
const auth_2 = require("../middleware/auth");
const router = express_1.default.Router();
router.post("/createReview", auth_1.authenticateToken, (0, auth_2.requireRole)(["CLIENT"]), reviewController_1.default.createReview);
router.get("/getAllReviewsForTalent/:talentId", auth_1.authenticateToken, (0, auth_2.requireRole)(["TALENT"]), reviewController_1.default.getAllReviewsForTalent);
router.get("/getAllReviewsForContract/:contractId", auth_1.authenticateToken, (0, auth_2.requireRole)(["CLIENT"]), reviewController_1.default.getAllReviewsForContract);
router.post("/createClientReview", auth_1.authenticateToken, (0, auth_2.requireRole)(["TALENT"]), reviewController_1.default.createClientReview);
router.get("/getClientReviewsForContract/:contractId", auth_1.authenticateToken, (0, auth_2.requireRole)(["TALENT"]), reviewController_1.default.getClientReviewsForContract);
router.get("/getAllClientReviews/:clientId", reviewController_1.default.getAllClientReviews);
exports.default = router;
//# sourceMappingURL=reviewRoutes.js.map