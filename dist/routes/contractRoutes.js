"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const contractController_1 = require("../controllers/contractController");
const auth_1 = require("../middleware/auth");
const auth_2 = require("../middleware/auth");
const router = express_1.default.Router();
// router.post(
//   "/create",
//   authenticateToken,
//   requireRole(["CLIENT"]),
//   createContract
// );
router.get("/client", auth_1.authenticateToken, (0, auth_2.requireRole)(["CLIENT"]), contractController_1.getContractsByClientId);
router.get("/talent", auth_1.authenticateToken, (0, auth_2.requireRole)(["TALENT"]), contractController_1.getContractsByTalentId);
router.put("/update/:id", auth_1.authenticateToken, contractController_1.updateContract);
router.put("/update/accepted/:id", auth_1.authenticateToken, (0, auth_2.requireRole)(["TALENT"]), contractController_1.updateContractAccepted);
exports.default = router;
//# sourceMappingURL=contractRoutes.js.map