const prService = require("../services/prService");
const { successResponse } = require("../utils/apiResponse");

const createPullRequest = async (req, res, next) => {
    try {
        const { repoId } = req.params;
        const { title, description, sourceBranch, targetBranch } = req.body;

        const pr = await prService.createPullRequest(repoId, req.user._id, {
            title,
            description,
            sourceBranch,
            targetBranch,
        });

        return successResponse(res, 201, "Pull request created successfully.", { pullRequest: pr });
    } catch (err) {
        next(err);
    }
};

const listPullRequests = async (req, res, next) => {
    try {
        const { repoId } = req.params;
        const status = req.query.status || "open";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;

        const result = await prService.listPullRequests(repoId, { status, page, limit });
        return successResponse(res, 200, "Pull requests retrieved.", result);
    } catch (err) {
        next(err);
    }
};

const getPullRequest = async (req, res, next) => {
    try {
        const { repoId, identifier } = req.params;
        const result = await prService.getPullRequest(repoId, identifier);
        return successResponse(res, 200, "Pull request retrieved.", result);
    } catch (err) {
        next(err);
    }
};

const mergePullRequest = async (req, res, next) => {
    try {
        const { repoId, id } = req.params;
        const mergedPR = await prService.mergePullRequest(repoId, id, req.user._id);
        return successResponse(res, 200, "Pull request merged successfully.", { pullRequest: mergedPR });
    } catch (err) {
        next(err);
    }
};

const closePullRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pr = await prService.closePullRequest(id, req.user._id);
        return successResponse(res, 200, "Pull request closed.", { pullRequest: pr });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createPullRequest,
    listPullRequests,
    getPullRequest,
    mergePullRequest,
    closePullRequest,
};
