const crypto = require("crypto");
const PullRequest = require("../models/pullRequestModel");
const Repository = require("../models/repoModel");
const Branch = require("../models/branchModel");
const RepoFile = require("../models/fileModel");
const Commit = require("../models/commitModel");
const Comment = require("../models/commentModel");
const Notification = require("../models/notificationModel");
const AppError = require("../utils/appError");

/**
 * Pull Request Service
 * Handles branch comparison, PR creation, diff generation, merging, and closure.
 */
class PullRequestService {
    /**
     * Compute diff between sourceBranch and targetBranch
     */
    async computeBranchDiff(repoId, sourceBranch, targetBranch) {
        const [sourceFiles, targetFiles] = await Promise.all([
            RepoFile.find({ repository: repoId, branch: sourceBranch }),
            RepoFile.find({ repository: repoId, branch: targetBranch }),
        ]);

        const targetMap = new Map(targetFiles.map((f) => [f.path, f]));
        const diffs = [];

        // Check source files against target files
        sourceFiles.forEach((src) => {
            const tgt = targetMap.get(src.path);
            if (!tgt) {
                // Newly added file
                diffs.push({
                    path: src.path,
                    status: "added",
                    additions: src.content ? src.content.split("\n").length : 0,
                    deletions: 0,
                    oldContent: "",
                    newContent: src.content,
                });
            } else if (tgt.content !== src.content) {
                // Modified file
                const oldLines = tgt.content ? tgt.content.split("\n") : [];
                const newLines = src.content ? src.content.split("\n") : [];
                diffs.push({
                    path: src.path,
                    status: "modified",
                    additions: Math.max(0, newLines.length - oldLines.length) + 1,
                    deletions: Math.max(0, oldLines.length - newLines.length),
                    oldContent: tgt.content,
                    newContent: src.content,
                });
            }
            targetMap.delete(src.path);
        });

        // Remaining target files were deleted in source
        targetMap.forEach((tgt) => {
            diffs.push({
                path: tgt.path,
                status: "deleted",
                additions: 0,
                deletions: tgt.content ? tgt.content.split("\n").length : 0,
                oldContent: tgt.content,
                newContent: "",
            });
        });

        return diffs;
    }

    /**
     * Create a Pull Request
     */
    async createPullRequest(repoId, authorId, { title, description = "", sourceBranch, targetBranch = "main" }) {
        if (sourceBranch === targetBranch) {
            throw new AppError("Source and target branches must be different.", 400, "IDENTICAL_BRANCHES");
        }

        const [repo, srcBranchDoc, tgtBranchDoc] = await Promise.all([
            Repository.findById(repoId),
            Branch.findOne({ repository: repoId, name: sourceBranch }),
            Branch.findOne({ repository: repoId, name: targetBranch }),
        ]);

        if (!repo) throw new AppError("Repository not found.", 404, "NOT_FOUND");
        if (!srcBranchDoc) throw new AppError(`Source branch '${sourceBranch}' does not exist.`, 404, "SOURCE_BRANCH_NOT_FOUND");
        if (!tgtBranchDoc) throw new AppError(`Target branch '${targetBranch}' does not exist.`, 404, "TARGET_BRANCH_NOT_FOUND");

        // Calculate next auto-incrementing PR number
        const lastPR = await PullRequest.findOne({ repository: repoId }).sort({ number: -1 });
        const number = lastPR ? lastPR.number + 1 : 1;

        const diff = await this.computeBranchDiff(repoId, sourceBranch, targetBranch);

        const newPR = await PullRequest.create({
            number,
            title: title.trim(),
            description: description.trim(),
            repository: repoId,
            author: authorId,
            sourceBranch,
            targetBranch,
            status: "open",
            diff,
        });

        // Notify repo owner if different from PR author
        if (repo.owner.toString() !== authorId.toString()) {
            await Notification.create({
                recipient: repo.owner,
                sender: authorId,
                type: "pr_created",
                repository: repoId,
                pullRequest: newPR._id,
            });
        }

        return await PullRequest.findById(newPR._id)
            .populate("author", "username name avatarUrl");
    }

    /**
     * List Pull Requests with filters
     */
    async listPullRequests(repoId, { status = "open", page = 1, limit = 25 }) {
        const query = { repository: repoId };
        if (status && status !== "all") {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const [pullRequests, total, openCount, closedCount] = await Promise.all([
            PullRequest.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("author", "username name avatarUrl"),
            PullRequest.countDocuments(query),
            PullRequest.countDocuments({ repository: repoId, status: "open" }),
            PullRequest.countDocuments({ repository: repoId, status: { $in: ["closed", "merged"] } }),
        ]);

        return {
            pullRequests,
            total,
            openCount,
            closedCount,
            page,
            limit,
        };
    }

    /**
     * Get PR details, comments, and files diff
     */
    async getPullRequest(repoId, identifier) {
        let query = { repository: repoId };
        if (!isNaN(identifier)) {
            query.number = parseInt(identifier);
        } else {
            query._id = identifier;
        }

        const pr = await PullRequest.findOne(query)
            .populate("author", "username name avatarUrl")
            .populate("mergedBy", "username name avatarUrl")
            .populate("closedBy", "username name avatarUrl");

        if (!pr) {
            throw new AppError("Pull request not found.", 404, "NOT_FOUND");
        }

        // Live diff computation if PR is still open
        let diff = pr.diff;
        if (pr.status === "open") {
            diff = await this.computeBranchDiff(repoId, pr.sourceBranch, pr.targetBranch);
        }

        const comments = await Comment.find({
            targetType: "PullRequest",
            targetId: pr._id,
        })
            .sort({ createdAt: 1 })
            .populate("author", "username name avatarUrl");

        return {
            pullRequest: pr,
            diff,
            comments,
        };
    }

    /**
     * Merge a Pull Request
     */
    async mergePullRequest(repoId, prId, currentUserId) {
        const pr = await PullRequest.findById(prId).populate("repository");
        if (!pr) {
            throw new AppError("Pull request not found.", 404, "NOT_FOUND");
        }

        if (pr.status !== "open") {
            throw new AppError(`Cannot merge a ${pr.status} pull request.`, 400, "CANNOT_MERGE");
        }

        const repo = pr.repository;
        const isOwner = repo.owner.toString() === currentUserId.toString();
        const isCollaborator = repo.collaborators?.some(
            (c) => c.user.toString() === currentUserId.toString() && ["write", "admin"].includes(c.role)
        );

        if (!isOwner && !isCollaborator) {
            throw new AppError("You do not have write permissions to merge pull requests in this repository.", 403, "FORBIDDEN");
        }

        // 1. Get all files from sourceBranch
        const sourceFiles = await RepoFile.find({ repository: repoId, branch: pr.sourceBranch });

        // 2. Overwrite target branch files with source branch files
        const mergeCommitSha = crypto.randomBytes(20).toString("hex");

        for (const sf of sourceFiles) {
            await RepoFile.findOneAndUpdate(
                { repository: repoId, branch: pr.targetBranch, path: sf.path },
                {
                    content: sf.content,
                    size: sf.size,
                    lastCommitSha: mergeCommitSha,
                    lastCommitMessage: `Merge pull request #${pr.number} from ${pr.sourceBranch}`,
                    lastCommitDate: new Date(),
                },
                { upsert: true, new: true }
            );
        }

        // 3. Create merge commit on targetBranch
        await Commit.create({
            sha: mergeCommitSha,
            message: `Merge pull request #${pr.number} from ${pr.sourceBranch} into ${pr.targetBranch}`,
            author: currentUserId,
            repository: repoId,
            branch: pr.targetBranch,
            stats: {
                totalAdditions: sourceFiles.reduce((acc, f) => acc + (f.content ? f.content.split("\n").length : 0), 0),
                totalDeletions: 0,
                filesCount: sourceFiles.length,
            },
        });

        // 4. Update target branch pointer
        await Branch.findOneAndUpdate(
            { repository: repoId, name: pr.targetBranch },
            { commitSha: mergeCommitSha }
        );

        // 5. Update PR record
        pr.status = "merged";
        pr.mergedAt = new Date();
        pr.mergedBy = currentUserId;
        await pr.save();

        // 6. Notify PR author if not merged by themselves
        if (pr.author.toString() !== currentUserId.toString()) {
            await Notification.create({
                recipient: pr.author,
                sender: currentUserId,
                type: "pr_merged",
                repository: repoId,
                pullRequest: pr._id,
            });
        }

        return await PullRequest.findById(pr._id)
            .populate("author", "username name avatarUrl")
            .populate("mergedBy", "username name avatarUrl");
    }

    /**
     * Close a Pull Request without merging
     */
    async closePullRequest(prId, currentUserId) {
        const pr = await PullRequest.findById(prId);
        if (!pr) throw new AppError("Pull request not found.", 404, "NOT_FOUND");
        if (pr.status !== "open") throw new AppError("Pull request is already closed or merged.", 400, "ALREADY_RESOLVED");

        pr.status = "closed";
        pr.closedAt = new Date();
        pr.closedBy = currentUserId;
        await pr.save();

        return pr;
    }
}

module.exports = new PullRequestService();
