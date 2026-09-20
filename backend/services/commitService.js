const Commit = require("../models/commitModel");
const AppError = require("../utils/appError");

/**
 * Commit Service
 * Handles commit history retrieval, pagination, and commit diff inspection.
 */
class CommitService {
    /**
     * List commits for a repository and branch with pagination
     */
    async listCommits(repoId, branchName = "main", page = 1, limit = 30) {
        const skip = (page - 1) * limit;

        const query = { repository: repoId };
        if (branchName) {
            query.branch = branchName;
        }

        const [commits, total] = await Promise.all([
            Commit.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("author", "username name avatarUrl"),
            Commit.countDocuments(query),
        ]);

        return {
            commits,
            total,
            page,
            limit,
            branch: branchName,
        };
    }

    /**
     * Get specific commit by SHA with detailed diff stats
     */
    async getCommitBySha(repoId, sha) {
        const commit = await Commit.findOne({ repository: repoId, sha })
            .populate("author", "username name avatarUrl")
            .populate("repository", "name owner defaultBranch");

        if (!commit) {
            throw new AppError(`Commit '${sha}' not found.`, 404, "COMMIT_NOT_FOUND");
        }

        // Fetch parent commit if present
        let parentCommit = null;
        if (commit.parentSha) {
            parentCommit = await Commit.findOne({ sha: commit.parentSha }).select("sha message createdAt");
        }

        return {
            ...commit.toObject(),
            parentCommit,
        };
    }
}

module.exports = new CommitService();
