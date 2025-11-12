"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const talentController_1 = require("../controllers/talentController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
router.get("/find-talent", talentController_1.findTalent);
router.get("/find-talent/:id", talentController_1.findTalentById);
router.get("/talents/search", talentController_1.findTalentBySkill);
router.put("/update-profile/", auth_1.authenticateToken, talentController_1.updateTalentProfile);
router.get("/talent-by-job-id/:jobId", auth_1.authenticateToken, talentController_1.getTalentsByJobId);
router.post("/upload-portfolio", auth_1.authenticateToken, upload_1.upload.any(), talentController_1.uploadPortfolio);
router.delete("/delete-portfolio", auth_1.authenticateToken, talentController_1.deletePortfolio);
exports.default = router;
//# sourceMappingURL=talentRoutes.js.map