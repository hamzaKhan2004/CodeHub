const repoService = require("../services/repoService");
const { successResponse } = require("../utils/apiResponse");

/**
 * Repository Controller
 * Pure HTTP transport handler: parses requests, delegates to repoService, formats responses.
 */

const createRepository = async (req, res, next) => {
    try {
        const ownerId = req.user ? req.user._id : req.body.owner;
        const { name, description, visibility, isPrivate, initializeReadme } = req.body;

        const repo = await repoService.createRepository(ownerId, {
            name,
            description,
            visibility,
            isPrivate,
            initializeReadme: initializeReadme !== undefined ? initializeReadme : true,
        });

        return successResponse(res, 201, "Repository created successfully.", {
            repository: repo,
            repositoryID: repo._id,
        });
    } catch (err) {
        next(err);
    }
};

const getAllRepositories = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || "";

        const result = await repoService.getAllRepositories({ search, page, limit });
        return successResponse(res, 200, "Repositories retrieved successfully.", result);
    } catch (err) {
        next(err);
    }
};

const fetchRepositoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user ? req.user._id : null;
        const repo = await repoService.getRepoById(id, currentUserId);
        return successResponse(res, 200, "Repository retrieved successfully.", { repository: repo });
    } catch (err) {
        next(err);
    }
};

const fetchRepositoryByOwnerAndName = async (req, res, next) => {
    try {
        const { owner, repoName } = req.params;
        const currentUserId = req.user ? req.user._id : null;
        const repo = await repoService.getRepoByOwnerAndName(owner, repoName, currentUserId);
        return successResponse(res, 200, "Repository retrieved successfully.", { repository: repo });
    } catch (err) {
        next(err);
    }
};

// Kept for backward compatibility with existing route
const fetchRepositoryByName = async (req, res, next) => {
    try {
        const { name } = req.params;
        const currentUserId = req.user ? req.user._id : null;
        // In case name contains slash owner/name
        if (name.includes("/")) {
            const [owner, repoName] = name.split("/");
            const repo = await repoService.getRepoByOwnerAndName(owner, repoName, currentUserId);
            return successResponse(res, 200, "Repository retrieved successfully.", { repository: repo });
        }

        const result = await repoService.getAllRepositories({ search: name, limit: 1 });
        const repo = result.repositories[0] || null;
        return successResponse(res, 200, "Repository retrieved successfully.", { repository: repo });
    } catch (err) {
        next(err);
    }
};

const fetchRepositoriesForCurrentUser = async (req, res, next) => {
    try {
        const { userID } = req.params;
        const currentUserId = req.user ? req.user._id : null;
        const repositories = await repoService.getUserRepositories(userID, currentUserId);
        return successResponse(res, 200, "Repositories retrieved successfully.", { repositories });
    } catch (err) {
        next(err);
    }
};

const updateRepositoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user._id;
        const repo = await repoService.updateRepository(id, currentUserId, req.body);
        return successResponse(res, 200, "Repository updated successfully.", { repository: repo });
    } catch (err) {
        next(err);
    }
};

const toggleVisibilityById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user._id;
        const repo = await repoService.toggleVisibility(id, currentUserId);
        return successResponse(res, 200, "Repository visibility toggled.", { repository: repo });
    } catch (err) {
        next(err);
    }
};

const deleteRepositoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user._id;
        const result = await repoService.deleteRepository(id, currentUserId);
        return successResponse(res, 200, result.message, null);
    } catch (err) {
        next(err);
    }
};

const starRepository = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await repoService.starRepository(id, req.user._id);
        return successResponse(res, 200, "Repository starred.", result);
    } catch (err) {
        next(err);
    }
};

const unstarRepository = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await repoService.unstarRepository(id, req.user._id);
        return successResponse(res, 200, "Repository unstarred.", result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createRepository,
    getAllRepositories,
    fetchRepositoryById,
    fetchRepositoryByName,
    fetchRepositoryByOwnerAndName,
    fetchRepositoriesForCurrentUser,
    updateRepositoryById,
    toggleVisibilityById,
    deleteRepositoryById,
    starRepository,
    unstarRepository,
};
