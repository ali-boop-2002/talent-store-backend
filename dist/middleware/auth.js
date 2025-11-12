"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimit = exports.requireOwnership = exports.requireVerified = exports.requireRole = exports.authenticateToken = void 0;
// src/middleware/auth.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const db_1 = __importDefault(require("../config/db"));
const authenticateToken = async (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Check if user still exists in database and fetch full user object
        const user = await db_1.default.user.findUnique({
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
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(403).json({
                error: "Invalid token",
                message: "Token is malformed or expired",
            });
        }
        return res.status(500).json({ error: "Authentication failed" });
    }
};
exports.authenticateToken = authenticateToken;
// Role-based middleware
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                error: "Insufficient permissions",
                message: "Your role does not have access to this resource",
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
// Optional: Check if user is verified
const requireVerified = (req, res, next) => {
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
exports.requireVerified = requireVerified;
// Optional: Check if user owns the resource
const requireOwnership = (userIdParam = "userId") => {
    return (req, res, next) => {
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
exports.requireOwnership = requireOwnership;
// Optional: Rate limiting for auth endpoints
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 5 requests per windowMs
    message: {
        error: "Too many authentication attempts",
        message: "Please try again later",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
//# sourceMappingURL=auth.js.map