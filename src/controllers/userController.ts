import prisma from "../config/db";
import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { supabase, PROFILE_PICS_BUCKET } from "../config/supabase";

const registerUserSchema = z
  .object({
    email: z.string().min(1, "Email is required").email("Invalid email format"),
    name: z.string().min(1, "Name is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    role: z.enum(["CLIENT", "TALENT", "ADMIN"]).default("CLIENT"),
    phone: z
      .string()
      .nullish()
      .transform((val) => val ?? null),
    avatar: z
      .string()
      .nullish()
      .transform((val) => val ?? null),
    keyBalance: z.number().default(0),
    isVerified: z.boolean().default(false),
    description: z
      .string()
      .nullish()
      .transform((val) => val ?? null),
    skills: z
      .array(z.string())
      .nullish()
      .transform((val) => val ?? null),
  })
  .refine(
    (data) => {
      if (data.role === "TALENT") {
        return data.description && data.skills;
      }
      return true;
    },
    {
      message: "Description and skills are required for talents",
    }
  );

const registerUser = async (req: Request, res: Response) => {
  try {
    const validatedData = registerUserSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: validatedData.email,
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password before storing
    const saltRounds = 12; // Higher number = more secure but slower
    const hashedPassword = await bcrypt.hash(
      validatedData.password,
      saltRounds
    );

    // Create user with hashed password
    const user = await prisma.user.create({
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
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Invalid data", error });
  }
};

// Update user schema (only allowed fields)
const updateUserSchema = z.object({
  name: z.string().nullish(),
  phone: z.string().nullish(),
  avatar: z.string().nullish(),
  description: z.string().nullish(),
  skills: z.array(z.string()).nullish(),
  userProfilePic: z.array(z.string()).nullish(),
  keyBalance: z.number().nullish(),
  isVerified: z.boolean().nullish(),
});

const gigSchema = z.object({
  name: z.string(),
  price: z.number(),
  hourlyPrice: z.boolean(),
  fixedPrice: z.boolean(),
  gigDescription: z.string(),
});

const createGig = async (req: Request, res: Response) => {
  try {
    const validatedData = gigSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const gig = await prisma.gig.create({
      data: {
        ...validatedData,
        userId: userId,
      },
    });
    res.status(200).json({ gig });
  } catch (error) {
    console.error("Create gig error:", error);
    res.status(500).json({ message: "Invalid data", error });
  }
};

const updateUser = async (req: Request, res: Response) => {
  try {
    const validatedData = updateUserSchema.parse(req.body);

    // Get user ID from authenticated user (set by auth middleware)
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Filter out undefined values - Prisma doesn't accept undefined in updates
    const dataToUpdate = Object.fromEntries(
      Object.entries(validatedData).filter(([, value]) => value !== undefined)
    );

    const user = await prisma.user.update({
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
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Invalid data", error });
  }
};

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json({ users });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    res.status(200).json({ user });
  } catch (error) {
    console.error("Get user by id error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Login schema
const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const loginUser = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
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
    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" } // Token expires in 7 days
    );

    // Set JWT token as HTTP-only cookie
    res.cookie("authToken", token, {
      httpOnly: true, // Prevents XSS
      secure: true, // HTTPS only in production
      sameSite: "none", // "none" for cross-domain production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
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
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

const logoutUser = async (req: Request, res: Response) => {
  try {
    // Clear the auth cookie
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Get users by skills
const getUsersBySkills = async (req: Request, res: Response) => {
  try {
    const { skills } = req.query;

    if (!skills) {
      return res.status(400).json({
        error: "Skills parameter is required",
        message: "Please provide skills as a query parameter",
      });
    }

    // Convert skills to array of strings
    let skillsArray: string[];
    if (Array.isArray(skills)) {
      skillsArray = skills.map((s) => String(s));
    } else {
      skillsArray = [String(skills)];
    }

    // Find users who have any of the specified skills
    const users = await prisma.user.findMany({
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
  } catch (error) {
    console.error("Get users by skills error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Upload profile picture
const uploadProfilePic = async (req: Request, res: Response) => {
  try {
    // Get user ID from authenticated user
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${userId}-${Date.now()}${fileExtension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(PROFILE_PICS_BUCKET)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return res.status(500).json({ error: "Failed to upload file" });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(PROFILE_PICS_BUCKET)
      .getPublicUrl(fileName);

    // Update user's avatar in database
    const updatedUser = await prisma.user.update({
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
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAllSkillsShuffled = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
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
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Get all skills shuffled error:", error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
};
export {
  getAllSkillsShuffled,
  getAllUsers,
  registerUser,
  loginUser,
  logoutUser,
  updateUser,
  getUsersBySkills,
  uploadProfilePic,
  createGig,
  getUserById,
};
