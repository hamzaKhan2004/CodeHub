const rateLimit = require("express-rate-limit");
const AppError = require("../utils/appError");

/**
 * Strict rate limiter for sensitive authentication endpoints (login, register).
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // max 50 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new AppError("Too many login attempts. Please try again after 15 minutes.", 429, "TOO_MANY_REQUESTS"));
    },
});

/**
 * General API rate limiter for standard read/write endpoints.
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // max 1000 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new AppError("Too many requests from this IP. Please slow down.", 429, "RATE_LIMIT_EXCEEDED"));
    },
});

module.exports = {
    authLimiter,
    apiLimiter,
};
