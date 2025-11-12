"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jobController_1 = require("../controllers/jobController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public routes
router.get("/", jobController_1.getAllJobs);
router.get("/:id", auth_1.authenticateToken, jobController_1.getJobById);
// Protected routes - only authenticated users can create jobs
router.post("/create", auth_1.authenticateToken, jobController_1.createJob);
router.post("/api/find-by-skills", jobController_1.getJobBasedOnSkills);
router.get("/api/find-by-client-id/:clientId", auth_1.authenticateToken, (0, auth_1.requireRole)(["CLIENT"]), jobController_1.getJobsByClientId);
router.put("/update-job-status/:jobId", auth_1.authenticateToken, (0, auth_1.requireRole)(["CLIENT"]), jobController_1.updateJobStatus);
// Admin-only routes (example)
// router.delete("/:id", authenticateToken, requireRole(["ADMIN"]), deleteJob);
exports.default = router;
//# sourceMappingURL=jobRoutes.js.map