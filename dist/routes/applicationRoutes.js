"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const applicationController_1 = require("../controllers/applicationController");
const auth_1 = require("../middleware/auth");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.post("/apply-for-job", auth_1.authenticateToken, applicationController_1.applyForJob);
router.get("/get-applications", auth_1.authenticateToken, applicationController_1.getApplications);
router.get("/get-applications-for-talent", auth_1.authenticateToken, (0, auth_1.requireRole)(["TALENT"]), applicationController_1.getApplicationsForTalent);
router.get("/get-application-by-job-id/:jobId", auth_1.authenticateToken, applicationController_1.getApplicationByJobId);
router.put("/update-application-status/:applicationId", auth_1.authenticateToken, (0, auth_1.requireRole)(["CLIENT"]), applicationController_1.updateApplicationStatus);
router.put("/withdraw-application/:applicationId", auth_1.authenticateToken, (0, auth_1.requireRole)(["TALENT"]), applicationController_1.withdrawApplication);
exports.default = router;
//# sourceMappingURL=applicationRoutes.js.map