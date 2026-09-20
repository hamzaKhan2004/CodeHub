const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/appError");

/**
 * Authentication Middleware
 * Validates JWT token from the Authorization header and attaches the user document to req.user.
 */
const requireAuth = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }

        if (!token) {
            return next(new AppError("Authentication required. Please provide a valid token.", 401, "UNAUTHORIZED"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return next(new AppError("The user belonging to this token no longer exists.", 401, "USER_NOT_FOUND"));
        }

        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
};

/**
 * Optional Authentication Middleware
 * If a token is provided and valid, attaches req.user. If no token is provided, proceeds anonymously without error.
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decoded.id).select("-password");
        if (user) {
            req.user = user;
        }
        next();
    } catch {
        // Silently proceed without user for optional auth
        next();
    }
};

module.exports = {
    requireAuth,
    optionalAuth,
};
