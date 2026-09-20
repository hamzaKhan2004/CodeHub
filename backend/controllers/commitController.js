const commitService = require("../services/commitService");
const { successResponse } = require("../utils/apiResponse");

const listCommits = async (req, res, next) => {
    try {
        const { repoId } = req.params;
        const branch = req.query.branch || "main";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;

        const result = await commitService.listCommits(repoId, branch, page, limit);
        return successResponse(res, 200, "Commits retrieved.", result);
    } catch (err) {
        next(err);
    }
};

const getCommitBySha = async (req, res, next) => {
    try {
        const { repoId, sha } = req.params;
        const commit = await commitService.getCommitBySha(repoId, sha);
        return successResponse(res, 200, "Commit details retrieved.", { commit });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    listCommits,
    getCommitBySha,
};
