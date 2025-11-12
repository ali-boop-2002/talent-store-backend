"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get("/talent/orders", auth_1.authenticateToken, (0, auth_1.requireRole)(["TALENT"]), orderController_1.getOrdersForTalent);
router.get("/client/orders", auth_1.authenticateToken, (0, auth_1.requireRole)(["CLIENT"]), orderController_1.getOrdersForClient);
exports.default = router;
//# sourceMappingURL=orderRoutes.js.map