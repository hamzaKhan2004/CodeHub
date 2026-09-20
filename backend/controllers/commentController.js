const commentService = require("../services/commentService");
const { successResponse } = require("../utils/apiResponse");

const addComment = async (req, res, next) => {
    try {
        const { repoId } = req.params;
        const { targetType, targetId, body } = req.body;

        const comment = await commentService.addComment(repoId, req.user._id, {
            targetType,
            targetId,
            body,
        });

        return successResponse(res, 201, "Comment posted successfully.", { comment });
    } catch (err) {
        next(err);
    }
};

const updateComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { body } = req.body;

        const comment = await commentService.updateComment(id, req.user._id, body);
        return successResponse(res, 200, "Comment updated.", { comment });
    } catch (err) {
        next(err);
    }
};

const deleteComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await commentService.deleteComment(id, req.user._id);
        return successResponse(res, 200, result.message, null);
    } catch (err) {
        next(err);
    }
};

const listComments = async (req, res, next) => {
    try {
        const { repoId } = req.params;
        const { targetType, targetId } = req.query;
        const comments = await commentService.listComments(repoId, targetType, targetId);
        return successResponse(res, 200, "Comments retrieved.", { comments });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    addComment,
    updateComment,
    deleteComment,
    listComments,
};
