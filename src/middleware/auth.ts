// src/middleware/auth.ts
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import prisma from "../config/db";

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = req.cookies?.authToken;

    // Fallback to Authorization header for backward compatibility
    if (!token) {
      const authHeader = req.headers.authorization;
      token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    }

    if (!token) {
      return res.status(401).json({
        error: "Access token required",
        message: "Please provide a valid authorization token or login again",
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Check if user still exists in database and fetch full user object
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid token",
        message: "User no longer exists",
      });
    }

    // Attach full user object to request
    req.user = user;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({
        error: "Invalid token",
        message: "Token is malformed or expired",
      });
    }
    return res.status(500).json({ error: "Authentication failed" });
  }
};

// Role-based middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        message: "Your role does not have access to this resource",
      });
    }
    next();
  };
};

// Optional: Check if user is verified
export const requireVerified = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Please authenticate first",
    });
  }

  // You might want to add isVerified check here if you have that field
  // For now, we'll just pass through
  next();
};

// Optional: Check if user owns the resource
export const requireOwnership = (userIdParam: string = "userId") => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Please authenticate first",
      });
    }

    const resourceUserId = req.params[userIdParam];
    if (req.user.id !== resourceUserId && req.user.role !== "ADMIN") {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only access your own resources",
      });
    }

    next();
  };
};

// Optional: Rate limiting for auth endpoints
// export const authRateLimit = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 10, // limit each IP to 5 requests per windowMs
//   message: {
//     error: "Too many authentication attempts",
//     message: "Please try again later",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });
