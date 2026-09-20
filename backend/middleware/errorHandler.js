const { errorResponse } = require("../utils/apiResponse");

/**
 * Centralized Error Handling Middleware
 * Intercepts all operational and unhandled exceptions across the application.
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errorCode = err.errorCode || "INTERNAL_ERROR";
    let details = err.details || null;

    // Handle Mongoose CastError (e.g. invalid ObjectId format)
    if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid format for resource ID: ${err.value}`;
        errorCode = "INVALID_ID";
    }

    // Handle Mongoose Schema Validation Errors
    if (err.name === "ValidationError") {
        statusCode = 422;
        message = "Validation Error";
        errorCode = "VALIDATION_FAILED";
        details = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
    }

    // Handle Mongoose Duplicate Key Error (Unique Constraint Violation)
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || "field";
        const val = err.keyValue ? err.keyValue[field] : "";
        message = `A resource with ${field} '${val}' already exists.`;
        errorCode = "DUPLICATE_RESOURCE";
    }

    // Handle JWT Errors
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token. Please authenticate again.";
        errorCode = "INVALID_TOKEN";
    }

    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token has expired. Please log in again.";
        errorCode = "TOKEN_EXPIRED";
    }

    if (process.env.NODE_ENV !== "production" && statusCode === 500) {
        console.error("💥 Unhandled Error:", err);
    }

    return errorResponse(res, statusCode, message, errorCode, details);
};

module.exports = errorHandler;
