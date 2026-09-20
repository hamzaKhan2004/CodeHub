const AppError = require("../utils/appError");

/**
 * Higher-order validation middleware that checks input against validation rules.
 */
const validate = (rules) => {
    return (req, res, next) => {
        const errors = [];

        for (const rule of rules) {
            const { field, location = "body", validator, message } = rule;
            const target = req[location] || {};
            const value = target[field];

            const isValid = validator(value, target);
            if (!isValid) {
                errors.push({ field, message });
            }
        }

        if (errors.length > 0) {
            const err = new AppError("Invalid request input.", 422, "VALIDATION_FAILED");
            err.details = errors;
            return next(err);
        }

        next();
    };
};

// Common Validators
const isEmail = (val) => typeof val === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
const isNonEmptyString = (val) => typeof val === "string" && val.trim().length > 0;
const isUsername = (val) => typeof val === "string" && /^[a-zA-Z0-9_-]{3,30}$/.test(val.trim());
const isRepoName = (val) => typeof val === "string" && /^[a-zA-Z0-9_.-]{1,100}$/.test(val.trim());

// Pre-packaged Validation Schemas
const validateSignup = validate([
    {
        field: "username",
        validator: isUsername,
        message: "Username must be 3-30 alphanumeric characters, hyphens, or underscores.",
    },
    {
        field: "email",
        validator: isEmail,
        message: "A valid email address is required.",
    },
    {
        field: "password",
        validator: (val) => typeof val === "string" && val.length >= 6,
        message: "Password must be at least 6 characters long.",
    },
]);

const validateLogin = validate([
    {
        field: "email",
        validator: isEmail,
        message: "A valid email address is required.",
    },
    {
        field: "password",
        validator: isNonEmptyString,
        message: "Password is required.",
    },
]);

const validateRepoCreate = validate([
    {
        field: "name",
        validator: isRepoName,
        message: "Repository name must be 1-100 characters and contain only letters, numbers, hyphens, dots, or underscores.",
    },
]);

const validateIssueCreate = validate([
    {
        field: "title",
        validator: (val) => typeof val === "string" && val.trim().length >= 2,
        message: "Issue title must be at least 2 characters long.",
    },
]);

const validateComment = validate([
    {
        field: "body",
        validator: isNonEmptyString,
        message: "Comment content cannot be empty.",
    },
]);

const validateFileCommit = validate([
    {
        field: "path",
        validator: isNonEmptyString,
        message: "File path is required.",
    },
    {
        field: "message",
        validator: (val, target) => {
            const msg = val || (target && target.commitMessage);
            return typeof msg === "string" && msg.trim().length >= 2;
        },
        message: "Commit message is required.",
    },
]);

const validatePullRequest = validate([
    {
        field: "title",
        validator: (val) => typeof val === "string" && val.trim().length >= 2,
        message: "Pull request title is required.",
    },
    {
        field: "sourceBranch",
        validator: isNonEmptyString,
        message: "Source branch is required.",
    },
    {
        field: "targetBranch",
        validator: isNonEmptyString,
        message: "Target branch is required.",
    },
]);

module.exports = {
    validate,
    validateSignup,
    validateLogin,
    validateRepoCreate,
    validateIssueCreate,
    validateComment,
    validateFileCommit,
    validatePullRequest,
};
