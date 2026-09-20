/**
 * Custom Operational Application Error
 * Encapsulates status codes, operational flags, and error details.
 */
class AppError extends Error {
    constructor(message, statusCode = 500, errorCode = "INTERNAL_SERVER_ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
