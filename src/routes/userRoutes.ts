import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  updateUser,
  getUsersBySkills,
  uploadProfilePic,
  createGig,
  getAllUsers,
  getUserById,
  getAllSkillsShuffled,
} from "../controllers/userController";
import { upload } from "../middleware/upload";
import {
  authenticateToken,
  requireRole,
  authRateLimit,
} from "../middleware/auth";

const router = express.Router();

// Test endpoint to verify JSON parsing
router.post("/test", (req, res) => {
  res.json({
    message: "Test endpoint working",
    body: req.body,
    headers: req.headers,
  });
});

// Public routes (no authentication required)
router.post("/register", registerUser);
router.post("/login", authRateLimit, loginUser); // Rate limited login
router.post("/logout", logoutUser); // Logout (clears cookie)

// Protected routes (authentication required)
router.put("/update", authenticateToken, updateUser); // Update user profile
router.post(
  "/upload-pic",
  authenticateToken,
  upload.single("profile-pic"),
  uploadProfilePic
); // Upload profile picture
router.get("/search", getUsersBySkills); // Search users by skills (public route)
router.post("/create-gig", authenticateToken, createGig); // Create a gig
router.get("/all-users", getAllUsers); // Get all users
router.get("/user/:id", authenticateToken, getUserById); // Get user by id
// Protected routes (authentication required)
router.get("/auth-check", authenticateToken, (req: express.Request, res) => {
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

router.get("/all-skills-shuffled", getAllSkillsShuffled);

// Example: Get current user profile
// router.get("/profile", authenticateToken, getUserProfile);

// Admin-only routes
// router.get("/admin/users", authenticateToken, requireRole(["ADMIN"]), getAllUsers);

export default router;
