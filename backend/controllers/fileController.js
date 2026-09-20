const fileService = require("../services/fileService");
const { successResponse } = require("../utils/apiResponse");

const getFileTree = async (req, res, next) => {
    try {
        const { repoId } = req.params;
        const branch = req.query.branch || "main";
        const path = req.query.path || "";

        const result = await fileService.getFileTree(repoId, branch, path);
        return successResponse(res, 200, "File tree retrieved.", result);
    } catch (err) {
        next(err);
    }
};

const getFileContent = async (req, res, next) => {
    try {
        const { repoId } = req.params;
        const branch = req.query.branch || "main";
        // Support path from query parameter or wildcard params
        const path = req.query.path || req.params[0] || "";

        const result = await fileService.getFileContent(repoId, branch, path);
        return successResponse(res, 200, "File content retrieved.", result);
    } catch (err) {
        next(err);
    }
};

const commitFile = async (req, res, next) => {
    try {
        const { repoId } = req.params;
        const { branch, path, content } = req.body;
        const message = req.body.message || req.body.commitMessage;

        const result = await fileService.commitFile(repoId, req.user._id, {
            branch: branch || "main",
            path,
            content,
            message,
        });

        return successResponse(res, 200, "File committed successfully.", result);
    } catch (err) {
        next(err);
    }
};

const deleteFile = async (req, res, next) => {
    try {
        const { repoId } = req.params;
        const { branch, path, message } = req.body;

        const result = await fileService.deleteFile(repoId, req.user._id, {
            branch: branch || "main",
            path,
            message,
        });

        return successResponse(res, 200, "File deleted successfully.", result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getFileTree,
    getFileContent,
    commitFile,
    deleteFile,
};
