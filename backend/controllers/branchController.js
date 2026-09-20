const branchService = require("../services/branchService");
const { successResponse } = require("../utils/apiResponse");

const listBranches = async (req, res, next) => {
    try {
        const { repoId } = req.params;
        const branches = await branchService.listBranches(repoId);
        return successResponse(res, 200, "Branches retrieved.", { branches });
    } catch (err) {
        next(err);
    }
};

const createBranch = async (req, res, next) => {
    try {
        const { repoId } = req.params;
        const { name, sourceBranch } = req.body;
        const branch = await branchService.createBranch(repoId, req.user._id, { name, sourceBranch });
        return successResponse(res, 201, "Branch created successfully.", { branch });
    } catch (err) {
        next(err);
    }
};

const setDefaultBranch = async (req, res, next) => {
    try {
        const { repoId } = req.params;
        const { branchName } = req.body;
        const branch = await branchService.setDefaultBranch(repoId, req.user._id, branchName);
        return successResponse(res, 200, "Default branch updated.", { branch });
    } catch (err) {
        next(err);
    }
};

const deleteBranch = async (req, res, next) => {
    try {
        const { repoId, branchName } = req.params;
        const result = await branchService.deleteBranch(repoId, req.user._id, branchName);
        return successResponse(res, 200, result.message, null);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    listBranches,
    createBranch,
    setDefaultBranch,
    deleteBranch,
};
