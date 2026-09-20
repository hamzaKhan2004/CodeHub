/**
 * Standardized API Response Helper
 * Enforces uniform envelopes across all endpoints.
 */

const successResponse = (res, statusCode = 200, message = "Success", data = null) => {
    const payload = {
        success: true,
        message,
    };

    if (data !== null && data !== undefined) {
        payload.data = data;
    }

    return res.status(statusCode).json(payload);
};

const errorResponse = (res, statusCode = 500, message = "An error occurred", error = "ERROR", details = null) => {
    const payload = {
        success: false,
        message,
        error,
    };

    if (details !== null && details !== undefined) {
        payload.details = details;
    }

    return res.status(statusCode).json(payload);
};

module.exports = {
    successResponse,
    errorResponse,
};
