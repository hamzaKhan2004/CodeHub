const issueService = require("../services/issueService");
const { successResponse } = require("../utils/apiResponse");

/**
 * Issue Controller
 * Pure HTTP transport handler for repository issues.
 */

const createIssue = async (req, res, next) => {
    try {
        const repoId = req.params.repoId || req.params.id || req.body.repository;
        const { title, description, labels, assignees } = req.body;

        const issue = await issueService.createIssue(repoId, req.user._id, {
            title,
            description,
            labels,
            assignees,
        });

        return successResponse(res, 201, "Issue created successfully.", { issue });
    } catch (err) {
        next(err);
    }
};

const getAllIssues = async (req, res, next) => {
    try {
        const repoId = req.params.repoId || req.params.id || req.query.repository;
        const status = req.query.status || "open";
        const label = req.query.label;
        const author = req.query.author;
        const search = req.query.search;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;

        const result = await issueService.listIssues(repoId, { status, label, author, search, page, limit });
        return successResponse(res, 200, "Issues retrieved.", result);
    } catch (err) {
        next(err);
    }
};

const getIssueById = async (req, res, next) => {
    try {
        const repoId = req.params.repoId || req.query.repoId;
        const identifier = req.params.id || req.params.issueNumber;

        const result = await issueService.getIssue(repoId, identifier);
        return successResponse(res, 200, "Issue retrieved.", result);
    } catch (err) {
        next(err);
    }
};

const updateIssueById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updated = await issueService.updateIssue(id, req.user._id, req.body);
        return successResponse(res, 200, "Issue updated successfully.", { issue: updated });
    } catch (err) {
        next(err);
    }
};

const deleteIssueById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await issueService.deleteIssue(id, req.user._id);
        return successResponse(res, 200, result.message, null);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createIssue,
    getAllIssues,
    getIssueById,
    updateIssueById,
    deleteIssueById,
};
