const vcsService = require("./vcsService");
const Repository = require("../models/repoModel");
const AppError = require("../utils/appError");

/**
 * Commit Service
 * Handles commit history retrieval from S3 via VCSService.
 */
class CommitService {
    async getRepoInfo(repoId) {
        const repo = await Repository.findById(repoId).populate("owner", "username name email");
        if (!repo) {
            throw new AppError("Repository not found.", 404, "NOT_FOUND");
        }
        return repo;
    }

    /**
     * List commits for a repository directly from S3
     */
    async listCommits(repoId, branchName = "main", page = 1, limit = 30) {
        const repo = await this.getRepoInfo(repoId);
        const ownerUsername = repo.owner?.username;
        const repoName = repo.name;
        const branch = branchName || repo.defaultBranch || "main";

        return await vcsService.getRemoteCommits(ownerUsername, repoName, branch);
    }

    /**
     * Get specific commit by SHA directly from S3
     */
    async getCommitBySha(repoId, sha) {
        const repo = await this.getRepoInfo(repoId);
        const ownerUsername = repo.owner?.username;
        const repoName = repo.name;

        const commitsRes = await vcsService.getRemoteCommits(ownerUsername, repoName);
        const found = (commitsRes.commits || []).find((c) => c.sha === sha);

        return {
            sha,
            message: found ? found.message : "Commit",
            createdAt: found ? found.createdAt : new Date(),
            author: found ? found.author : { username: ownerUsername },
            repository: {
                _id: repo._id,
                name: repo.name,
                owner: repo.owner,
                defaultBranch: repo.defaultBranch,
            },
        };
    }
}

module.exports = new CommitService();
