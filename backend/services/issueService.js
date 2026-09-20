const Issue = require("../models/issueModel");
const Repository = require("../models/repoModel");
const Comment = require("../models/commentModel");
const Notification = require("../models/notificationModel");
const AppError = require("../utils/appError");

/**
 * Issue Service
 * Handles GitHub-style issue creation, numbering, filters, status transitions, and comments.
 */
class IssueService {
    /**
     * Create a new issue
     */
    async createIssue(repoId, authorId, { title, description = "", labels = [], assignees = [] }) {
        const repo = await Repository.findById(repoId);
        if (!repo) {
            throw new AppError("Repository not found.", 404, "NOT_FOUND");
        }

        // Calculate next auto-incrementing issueNumber for this repository
        const lastIssue = await Issue.findOne({ repository: repoId }).sort({ issueNumber: -1 });
        const issueNumber = lastIssue ? lastIssue.issueNumber + 1 : 1;

        const newIssue = await Issue.create({
            issueNumber,
            title: title.trim(),
            description: description.trim(),
            repository: repoId,
            author: authorId,
            labels: Array.isArray(labels) ? labels : [],
            assignees: Array.isArray(assignees) ? assignees : [],
            status: "open",
        });

        // Add issue reference to repository
        await Repository.findByIdAndUpdate(repoId, {
            $addToSet: { issues: newIssue._id },
        });

        // Notify repo owner if author is different
        if (repo.owner.toString() !== authorId.toString()) {
            await Notification.create({
                recipient: repo.owner,
                sender: authorId,
                type: "issue_created",
                repository: repoId,
                issue: newIssue._id,
            });
        }

        return await Issue.findById(newIssue._id)
            .populate("author", "username name avatarUrl")
            .populate("assignees", "username name avatarUrl");
    }

    /**
     * List issues for a repository with filters (status, label, author) and count summaries
     */
    async listIssues(repoId, { status = "open", label, author, search, page = 1, limit = 25 }) {
        const query = { repository: repoId };

        if (status && status !== "all") {
            query.status = status;
        }

        if (label) {
            query.labels = label;
        }

        if (author) {
            query.author = author;
        }

        if (search && search.trim()) {
            query.title = { $regex: search.trim(), $options: "i" };
        }

        const skip = (page - 1) * limit;

        const [issues, total, openCount, closedCount] = await Promise.all([
            Issue.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("author", "username name avatarUrl")
                .populate("assignees", "username name avatarUrl"),
            Issue.countDocuments(query),
            Issue.countDocuments({ repository: repoId, status: "open" }),
            Issue.countDocuments({ repository: repoId, status: "closed" }),
        ]);

        return {
            issues,
            total,
            openCount,
            closedCount,
            page,
            limit,
        };
    }

    /**
     * Get single issue by number or ID, along with discussion comments
     */
    async getIssue(repoId, identifier) {
        let query = { repository: repoId };
        if (!isNaN(identifier)) {
            query.issueNumber = parseInt(identifier);
        } else {
            query._id = identifier;
        }

        const issue = await Issue.findOne(query)
            .populate("author", "username name avatarUrl")
            .populate("assignees", "username name avatarUrl")
            .populate("closedBy", "username name avatarUrl");

        if (!issue) {
            throw new AppError("Issue not found.", 404, "ISSUE_NOT_FOUND");
        }

        const comments = await Comment.find({
            targetType: "Issue",
            targetId: issue._id,
        })
            .sort({ createdAt: 1 })
            .populate("author", "username name avatarUrl");

        return {
            issue,
            comments,
        };
    }

    /**
     * Update an issue (title, description, status, labels, assignees)
     */
    async updateIssue(issueId, currentUserId, { title, description, status, labels, assignees }) {
        const issue = await Issue.findById(issueId).populate("repository");
        if (!issue) {
            throw new AppError("Issue not found.", 404, "ISSUE_NOT_FOUND");
        }

        const isAuthor = issue.author.toString() === currentUserId.toString();
        const isRepoOwner = issue.repository.owner.toString() === currentUserId.toString();

        if (!isAuthor && !isRepoOwner) {
            throw new AppError("You do not have permission to update this issue.", 403, "FORBIDDEN");
        }

        if (title !== undefined) issue.title = title.trim();
        if (description !== undefined) issue.description = description.trim();
        if (labels !== undefined && Array.isArray(labels)) issue.labels = labels;
        if (assignees !== undefined && Array.isArray(assignees)) issue.assignees = assignees;

        if (status !== undefined && ["open", "closed"].includes(status)) {
            if (status === "closed" && issue.status !== "closed") {
                issue.status = "closed";
                issue.closedAt = new Date();
                issue.closedBy = currentUserId;
            } else if (status === "open" && issue.status !== "open") {
                issue.status = "open";
                issue.closedAt = null;
                issue.closedBy = null;
            }
        }

        await issue.save();

        return await Issue.findById(issue._id)
            .populate("author", "username name avatarUrl")
            .populate("assignees", "username name avatarUrl")
            .populate("closedBy", "username name avatarUrl");
    }

    /**
     * Delete an issue
     */
    async deleteIssue(issueId, currentUserId) {
        const issue = await Issue.findById(issueId).populate("repository");
        if (!issue) {
            throw new AppError("Issue not found.", 404, "ISSUE_NOT_FOUND");
        }

        const isAuthor = issue.author.toString() === currentUserId.toString();
        const isRepoOwner = issue.repository.owner.toString() === currentUserId.toString();

        if (!isAuthor && !isRepoOwner) {
            throw new AppError("You do not have permission to delete this issue.", 403, "FORBIDDEN");
        }

        await Promise.all([
            Issue.findByIdAndDelete(issueId),
            Comment.deleteMany({ targetType: "Issue", targetId: issueId }),
            Repository.findByIdAndUpdate(issue.repository._id, { $pull: { issues: issueId } }),
        ]);

        return { message: "Issue deleted successfully." };
    }
}

module.exports = new IssueService();
