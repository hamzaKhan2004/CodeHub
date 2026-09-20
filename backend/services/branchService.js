const Branch = require("../models/branchModel");
const Repository = require("../models/repoModel");
const Commit = require("../models/commitModel");
const AppError = require("../utils/appError");

/**
 * Branch Service
 * Handles branch listing, creation from existing branches/commits, setting default branches, and deletion.
 */
class BranchService {
    /**
     * List all branches for a repository
     */
    async listBranches(repoId) {
        const branches = await Branch.find({ repository: repoId })
            .sort({ isDefault: -1, name: 1 })
            .populate("createdBy", "username name avatarUrl");
        return branches;
    }

    /**
     * Create a new branch
     */
    async createBranch(repoId, currentUserId, { name, sourceBranch = "main" }) {
        const trimmedName = name.trim();

        // Validate branch name
        if (!/^[a-zA-Z0-9/_.-]{1,100}$/.test(trimmedName)) {
            throw new AppError("Invalid branch name. Only letters, numbers, hyphens, slashes, and dots are allowed.", 400, "INVALID_BRANCH_NAME");
        }

        // Check if branch already exists
        const existing = await Branch.findOne({ repository: repoId, name: trimmedName });
        if (existing) {
            throw new AppError(`Branch '${trimmedName}' already exists.`, 409, "BRANCH_EXISTS");
        }

        // Find commit SHA from source branch or fallback to repository's latest commit
        const source = await Branch.findOne({ repository: repoId, name: sourceBranch });
        let commitSha = source ? source.commitSha : "";

        if (!commitSha) {
            const latestCommit = await Commit.findOne({ repository: repoId }).sort({ createdAt: -1 });
            commitSha = latestCommit ? latestCommit.sha : "";
        }

        const newBranch = await Branch.create({
            name: trimmedName,
            repository: repoId,
            commitSha,
            isDefault: false,
            createdBy: currentUserId,
        });

        return newBranch;
    }

    /**
     * Set the default branch (e.g. main / master)
     */
    async setDefaultBranch(repoId, currentUserId, branchName) {
        const repo = await Repository.findById(repoId);
        if (!repo) {
            throw new AppError("Repository not found.", 404, "NOT_FOUND");
        }

        if (repo.owner.toString() !== currentUserId.toString()) {
            throw new AppError("Only the repository owner can change the default branch.", 403, "FORBIDDEN");
        }

        const branch = await Branch.findOne({ repository: repoId, name: branchName });
        if (!branch) {
            throw new AppError(`Branch '${branchName}' not found.`, 404, "BRANCH_NOT_FOUND");
        }

        // Unset old default and set new default
        await Branch.updateMany({ repository: repoId }, { isDefault: false });
        branch.isDefault = true;
        await branch.save();

        repo.defaultBranch = branchName;
        await repo.save();

        return branch;
    }

    /**
     * Delete a branch
     */
    async deleteBranch(repoId, currentUserId, branchName) {
        const repo = await Repository.findById(repoId);
        if (!repo) {
            throw new AppError("Repository not found.", 404, "NOT_FOUND");
        }

        const branch = await Branch.findOne({ repository: repoId, name: branchName });
        if (!branch) {
            throw new AppError(`Branch '${branchName}' not found.`, 404, "BRANCH_NOT_FOUND");
        }

        if (branch.isDefault || repo.defaultBranch === branchName) {
            throw new AppError("Cannot delete the default branch of a repository.", 400, "CANNOT_DELETE_DEFAULT_BRANCH");
        }

        await Branch.findByIdAndDelete(branch._id);

        return { message: `Branch '${branchName}' deleted successfully.` };
    }
}

module.exports = new BranchService();
