const Comment = require("../models/commentModel");
const Issue = require("../models/issueModel");
const PullRequest = require("../models/pullRequestModel");
const Notification = require("../models/notificationModel");
const Repository = require("../models/repoModel");
const AppError = require("../utils/appError");

/**
 * Comment Service
 * Manages comments on issues and pull requests with strict ownership controls.
 */
class CommentService {
    /**
     * Add comment to an Issue or Pull Request
     */
    async addComment(repoId, authorId, { targetType, targetId, body }) {
        if (!["Issue", "PullRequest"].includes(targetType)) {
            throw new AppError("Target type must be 'Issue' or 'PullRequest'.", 400, "INVALID_TARGET_TYPE");
        }

        let targetModel = targetType === "Issue" ? Issue : PullRequest;
        const target = await targetModel.findById(targetId);
        if (!target) {
            throw new AppError(`${targetType} not found.`, 404, "TARGET_NOT_FOUND");
        }

        const comment = await Comment.create({
            author: authorId,
            body: body.trim(),
            targetType,
            targetId,
            repository: repoId,
        });

        // Increment commentsCount on the target
        await targetModel.findByIdAndUpdate(targetId, {
            $inc: { commentsCount: 1 },
        });

        // Notify target author if different from commenter
        if (target.author.toString() !== authorId.toString()) {
            await Notification.create({
                recipient: target.author,
                sender: authorId,
                type: targetType === "Issue" ? "issue_comment" : "pr_comment",
                repository: repoId,
                issue: targetType === "Issue" ? target._id : null,
                pullRequest: targetType === "PullRequest" ? target._id : null,
            });
        }

        return await Comment.findById(comment._id).populate("author", "username name avatarUrl");
    }

    /**
     * Update comment content
     */
    async updateComment(commentId, currentUserId, body) {
        const comment = await Comment.findById(commentId);
        if (!comment) throw new AppError("Comment not found.", 404, "NOT_FOUND");

        if (comment.author.toString() !== currentUserId.toString()) {
            throw new AppError("You can only edit your own comments.", 403, "FORBIDDEN");
        }

        comment.body = body.trim();
        await comment.save();

        return await Comment.findById(comment._id).populate("author", "username name avatarUrl");
    }

    /**
     * Delete comment
     */
    async deleteComment(commentId, currentUserId) {
        const comment = await Comment.findById(commentId).populate("repository");
        if (!comment) throw new AppError("Comment not found.", 404, "NOT_FOUND");

        const isAuthor = comment.author.toString() === currentUserId.toString();
        const isRepoOwner = comment.repository?.owner.toString() === currentUserId.toString();

        if (!isAuthor && !isRepoOwner) {
            throw new AppError("You do not have permission to delete this comment.", 403, "FORBIDDEN");
        }

        let targetModel = comment.targetType === "Issue" ? Issue : PullRequest;
        await Promise.all([
            Comment.findByIdAndDelete(commentId),
            targetModel.findByIdAndUpdate(comment.targetId, { $inc: { commentsCount: -1 } }),
        ]);

        return { message: "Comment deleted successfully." };
    }

    /**
     * List comments for a repository or specific target
     */
    async listComments(repoId, targetType, targetId) {
        const query = { repository: repoId };
        if (targetType) query.targetType = targetType;
        if (targetId) query.targetId = targetId;
        return await Comment.find(query)
            .sort({ createdAt: 1 })
            .populate("author", "username name avatarUrl");
    }
}

module.exports = new CommentService();
