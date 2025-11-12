"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.createGig = exports.uploadProfilePic = exports.getUsersBySkills = exports.updateUser = exports.logoutUser = exports.loginUser = exports.registerUser = exports.getAllUsers = exports.getAllSkillsShuffled = void 0;
const db_1 = __importDefault(require("../config/db"));
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const supabase_1 = require("../config/supabase");
const registerUserSchema = zod_1.z
    .object({
    email: zod_1.z.string().min(1, "Email is required").email("Invalid email format"),
    name: zod_1.z.string().min(1, "Name is required"),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
    role: zod_1.z.enum(["CLIENT", "TALENT", "ADMIN"]).default("CLIENT"),
    phone: zod_1.z
        .string()
        .nullish()
        .transform((val) => val ?? null),
    avatar: zod_1.z
        .string()
        .nullish()
        .transform((val) => val ?? null),
    keyBalance: zod_1.z.number().default(0),
    isVerified: zod_1.z.boolean().default(false),
    description: zod_1.z
        .string()
        .nullish()
        .transform((val) => val ?? null),
    skills: zod_1.z
        .array(zod_1.z.string())
        .nullish()
        .transform((val) => val ?? null),
})
    .refine((data) => {
    if (data.role === "TALENT") {
        return data.description && data.skills;
    }
    return true;
}, {
    message: "Description and skills are required for talents",
});
const registerUser = async (req, res) => {
    try {
        const validatedData = registerUserSchema.parse(req.body);
        // Check if user already exists
        const existingUser = await db_1.default.user.findUnique({
            where: {
                email: validatedData.email,
            },
        });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }
        // Hash the password before storing
        const saltRounds = 12; // Higher number = more secure but slower
        const hashedPassword = await bcryptjs_1.default.hash(validatedData.password, saltRounds);
        // Create user with hashed password
        const user = await db_1.default.user.create({
            data: {
                ...validatedData,
                password: hashedPassword, // Store hashed password, not plain text
                skills: validatedData.skills || undefined, // Convert null to undefined for Prisma
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                avatar: true,
                description: true,
                skills: true,
                keyBalance: true,
                isVerified: true,
                createdAt: true,
                // Don't return password in response
            },
        });
        res.status(201).json({
            message: "User created successfully",
            user: user,
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Invalid data", error });
    }
};
exports.registerUser = registerUser;
// Update user schema (only allowed fields)
const updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().nullish(),
    phone: zod_1.z.string().nullish(),
    avatar: zod_1.z.string().nullish(),
    description: zod_1.z.string().nullish(),
    skills: zod_1.z.array(zod_1.z.string()).nullish(),
    userProfilePic: zod_1.z.array(zod_1.z.string()).nullish(),
    keyBalance: zod_1.z.number().nullish(),
    isVerified: zod_1.z.boolean().nullish(),
});
const gigSchema = zod_1.z.object({
    name: zod_1.z.string(),
    price: zod_1.z.number(),
    hourlyPrice: zod_1.z.boolean(),
    fixedPrice: zod_1.z.boolean(),
    gigDescription: zod_1.z.string(),
});
const createGig = async (req, res) => {
    try {
        const validatedData = gigSchema.parse(req.body);
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const gig = await db_1.default.gig.create({
            data: {
                ...validatedData,
                userId: userId,
            },
        });
        res.status(200).json({ gig });
    }
    catch (error) {
        console.error("Create gig error:", error);
        res.status(500).json({ message: "Invalid data", error });
    }
};
exports.createGig = createGig;
const updateUser = async (req, res) => {
    try {
        const validatedData = updateUserSchema.parse(req.body);
        // Get user ID from authenticated user (set by auth middleware)
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        // Filter out undefined values - Prisma doesn't accept undefined in updates
        const dataToUpdate = Object.fromEntries(Object.entries(validatedData).filter(([, value]) => value !== undefined));
        const user = await db_1.default.user.update({
            where: {
                id: userId,
            },
            data: dataToUpdate,
            select: {
                email: true,
                name: true,
                role: true,
                phone: true,
                avatar: true,
                description: true,
                skills: true,
                keyBalance: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
                userProfilePic: true,
            },
        });
        res.status(200).json({
            message: "User updated successfully",
            user: user,
        });
    }
    catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ message: "Invalid data", error });
    }
};
exports.updateUser = updateUser;
const getAllUsers = async (req, res) => {
    try {
        const users = await db_1.default.user.findMany();
        res.status(200).json({ users });
    }
    catch (error) {
        console.error("Get all users error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
        });
        res.status(200).json({ user });
    }
    catch (error) {
        console.error("Get user by id error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
exports.getUserById = getUserById;
// Login schema
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().min(1, "Email is required").email("Invalid email format"),
    password: zod_1.z.string().min(1, "Password is required"),
});
const loginUser = async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        // Find user by email
        const user = await db_1.default.user.findUnique({
            where: {
                email: validatedData.email,
            },
        });
        if (!user) {
            return res.status(401).json({
                error: "Invalid credentials",
                message: "Email or password is incorrect",
            });
        }
        // Check if user has a password (for users created via OAuth, password might be null)
        if (!user.password) {
            return res.status(401).json({
                error: "Invalid credentials",
                message: "Please use the social login method you registered with",
            });
        }
        // Compare provided password with hashed password
        const isPasswordValid = await bcryptjs_1.default.compare(validatedData.password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: "Invalid credentials",
                message: "Email or password is incorrect",
            });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: user.role,
        }, process.env.JWT_SECRET, { expiresIn: "7d" } // Token expires in 7 days
        );
        // Set JWT token as HTTP-only cookie
        res.cookie("authToken", token, {
            httpOnly: true, // Can't be accessed by JavaScript (prevents XSS)
            secure: process.env.NODE_ENV === "production", // Only sent over HTTPS in production
            sameSite: "strict", // CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
            path: "/", // Available for all routes
        });
        // Return user data (no token in response body)
        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
                avatar: user.avatar,
                keyBalance: user.keyBalance,
                userProfilePic: user.userProfilePic,
                description: user.description,
                skills: user.skills,
                isVerified: user.isVerified,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
exports.loginUser = loginUser;
const logoutUser = async (req, res) => {
    try {
        // Clear the auth cookie
        res.clearCookie("authToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
        });
        res.status(200).json({
            message: "Logout successful",
        });
    }
    catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
exports.logoutUser = logoutUser;
// Get users by skills
const getUsersBySkills = async (req, res) => {
    try {
        const { skills } = req.query;
        if (!skills) {
            return res.status(400).json({
                error: "Skills parameter is required",
                message: "Please provide skills as a query parameter",
            });
        }
        // Convert skills to array of strings
        let skillsArray;
        if (Array.isArray(skills)) {
            skillsArray = skills.map((s) => String(s));
        }
        else {
            skillsArray = [String(skills)];
        }
        // Find users who have any of the specified skills
        const users = await db_1.default.user.findMany({
            where: {
                role: "TALENT", // Only get talent users
                skills: {
                    hasSome: skillsArray, // PostgreSQL array contains any of these skills
                },
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                avatar: true,
                description: true,
                skills: true,
                userProfilePic: true,
                keyBalance: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
                // Don't return password or sensitive data
            },
            orderBy: {
                createdAt: "desc", // Most recent first
            },
        });
        res.status(200).json({
            message: "Users found",
            count: users.length,
            skills: skillsArray,
            users: users,
        });
    }
    catch (error) {
        console.error("Get users by skills error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
exports.getUsersBySkills = getUsersBySkills;
// Upload profile picture
const uploadProfilePic = async (req, res) => {
    try {
        // Get user ID from authenticated user
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        // Generate unique filename
        const fileExtension = path_1.default.extname(req.file.originalname);
        const fileName = `${userId}-${Date.now()}${fileExtension}`;
        // Upload to Supabase Storage
        const { data, error } = await supabase_1.supabase.storage
            .from(supabase_1.PROFILE_PICS_BUCKET)
            .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false, // Don't overwrite existing files
        });
        if (error) {
            console.error("Supabase upload error:", error);
            return res.status(500).json({ error: "Failed to upload file" });
        }
        // Get public URL
        const { data: urlData } = supabase_1.supabase.storage
            .from(supabase_1.PROFILE_PICS_BUCKET)
            .getPublicUrl(fileName);
        // Update user's avatar in database
        const updatedUser = await db_1.default.user.update({
            where: { id: userId },
            data: { userProfilePic: [urlData.publicUrl] },
            select: {
                id: true,
                email: true,
                name: true,
                userProfilePic: true,
                role: true,
            },
        });
        res.status(200).json({
            message: "Profile picture uploaded successfully",
            userProfilePic: urlData.publicUrl,
            user: updatedUser,
        });
    }
    catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.uploadProfilePic = uploadProfilePic;
const getAllSkillsShuffled = async (req, res) => {
    try {
        const users = await db_1.default.user.findMany({
            select: {
                skills: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        if (users) {
            const shuffledSkills = users
                .flatMap((user) => user.skills)
                .sort(() => Math.random() - 0.5);
            res.status(200).json({ skills: shuffledSkills });
        }
        else {
            res.status(404).json({ message: "User not found" });
        }
    }
    catch (error) {
        console.error("Get all skills shuffled error:", error);
        res.status(500).json({ message: "Internal server error", error: error });
    }
};
exports.getAllSkillsShuffled = getAllSkillsShuffled;
//# sourceMappingURL=userController.js.map