const Repository = require("../models/repoModel");
const AppError = require("../utils/appError");

/**
 * Ensures the authenticated user owns the resource identified by req.params[paramKey]
 * Used for user profile operations (preventing users from updating or deleting others).
 */
const requireSelf = (paramKey = "id") => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError("Authentication required.", 401, "UNAUTHORIZED"));
        }

        const targetId = req.params[paramKey];
        if (req.user._id.toString() !== targetId) {
            return next(new AppError("You are not authorized to perform this action on another user's account.", 403, "FORBIDDEN"));
        }

        next();
    };
};

/**
 * Checks repository read access.
 * Public repositories are visible to everyone.
 * Private repositories are only visible to the owner and collaborators.
 */
const requireRepoReadAccess = async (req, res, next) => {
    try {
        const repoId = req.params.id || req.params.repoId;
        const repository = await Repository.findById(repoId).populate("owner", "username email avatarUrl");

        if (!repository) {
            return next(new AppError("Repository not found.", 404, "NOT_FOUND"));
        }

        const isPublic = repository.visibility === true || repository.isPrivate === false;
        const isOwner = req.user && repository.owner._id.toString() === req.user._id.toString();
        const isCollaborator = req.user && repository.collaborators?.some(
            (c) => c.user.toString() === req.user._id.toString()
        );

        if (!isPublic && !isOwner && !isCollaborator) {
            // Return 404 to avoid leaking the existence of private repositories (GitHub standard)
            return next(new AppError("Repository not found.", 404, "NOT_FOUND"));
        }

        req.repository = repository;
        next();
    } catch (err) {
        next(err);
    }
};

/**
 * Ensures the authenticated user is the OWNER of the repository.
 * Used for deleting repositories, changing visibility, managing collaborators.
 */
const requireRepoOwner = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(new AppError("Authentication required.", 401, "UNAUTHORIZED"));
        }

        const repoId = req.params.id || req.params.repoId;
        const repository = await Repository.findById(repoId);

        if (!repository) {
            return next(new AppError("Repository not found.", 404, "NOT_FOUND"));
        }

        const isOwner = repository.owner.toString() === req.user._id.toString();
        if (!isOwner) {
            return next(new AppError("Only the repository owner can perform this operation.", 403, "FORBIDDEN"));
        }

        req.repository = repository;
        next();
    } catch (err) {
        next(err);
    }
};

/**
 * Ensures the authenticated user has WRITE permissions (Owner or Collaborator with write access)
 * Used for creating branches, committing files, closing issues, merging PRs.
 */
const requireRepoWriteAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(new AppError("Authentication required.", 401, "UNAUTHORIZED"));
        }

        const repoId = req.params.id || req.params.repoId;
        const repository = await Repository.findById(repoId);

        if (!repository) {
            return next(new AppError("Repository not found.", 404, "NOT_FOUND"));
        }

        const isOwner = repository.owner.toString() === req.user._id.toString();
        const isCollaborator = repository.collaborators?.some(
            (c) => c.user.toString() === req.user._id.toString() && (c.role === "write" || c.role === "admin")
        );

        if (!isOwner && !isCollaborator) {
            return next(new AppError("Write permission required for this repository.", 403, "FORBIDDEN"));
        }

        req.repository = repository;
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = {
    requireSelf,
    requireRepoReadAccess,
    requireRepoOwner,
    requireRepoWriteAccess,
};
