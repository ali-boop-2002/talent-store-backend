"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const upload_1 = require("../middleware/upload");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Test endpoint to verify JSON parsing
router.post("/test", (req, res) => {
    res.json({
        message: "Test endpoint working",
        body: req.body,
        headers: req.headers,
    });
});
// Public routes (no authentication required)
router.post("/register", userController_1.registerUser);
router.post("/login", auth_1.authRateLimit, userController_1.loginUser); // Rate limited login
router.post("/logout", userController_1.logoutUser); // Logout (clears cookie)
// Protected routes (authentication required)
router.put("/update", auth_1.authenticateToken, userController_1.updateUser); // Update user profile
router.post("/upload-pic", auth_1.authenticateToken, upload_1.upload.single("profile-pic"), userController_1.uploadProfilePic); // Upload profile picture
router.get("/search", userController_1.getUsersBySkills); // Search users by skills (public route)
router.post("/create-gig", auth_1.authenticateToken, userController_1.createGig); // Create a gig
router.get("/all-users", userController_1.getAllUsers); // Get all users
router.get("/user/:id", auth_1.authenticateToken, userController_1.getUserById); // Get user by id
// Protected routes (authentication required)
router.get("/auth-check", auth_1.authenticateToken, (req, res) => {
    if (!req.user) {
        return res.status(401).json({ authenticated: false });
    }
    res.json({
        authenticated: true,
        user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
        },
    });
});
router.get("/all-skills-shuffled", userController_1.getAllSkillsShuffled);
// Example: Get current user profile
// router.get("/profile", authenticateToken, getUserProfile);
// Admin-only routes
// router.get("/admin/users", authenticateToken, requireRole(["ADMIN"]), getAllUsers);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map