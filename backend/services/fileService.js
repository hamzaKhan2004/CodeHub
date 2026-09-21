const vcsService = require("./vcsService");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const RepoFile = require("../models/fileModel");
const Commit = require("../models/commitModel");
const Branch = require("../models/branchModel");
const AppError = require("../utils/appError");

/**
 * File & Tree Service
 * Reads directly from VCSService (real S3 storage) and synchronizes metadata.
 */
class FileService {
    cleanPath(rawPath) {
        if (!rawPath) return "";
        return rawPath.replace(/^[./\\]+/, "").replace(/\\/g, "/");
    }

    async getRepoInfo(repoId) {
        const repo = await Repository.findById(repoId).populate("owner", "username name email");
        if (!repo) {
            throw new AppError("Repository not found.", 404, "NOT_FOUND");
        }
        return repo;
    }

    /**
     * List files and folders for a given repository, branch, and directory path directly from S3
     */
    async getFileTree(repoId, branchName = "main", dirPath = "") {
        const repo = await this.getRepoInfo(repoId);
        const ownerUsername = repo.owner?.username;
        const repoName = repo.name;
        const branch = branchName || repo.defaultBranch || "main";

        const result = await vcsService.getRemoteTree(ownerUsername, repoName, branch, dirPath);
        return result;
    }

    /**
     * Get single file content and commit metadata directly from S3
     */
    async getFileContent(repoId, branchName = "main", filePath) {
        const repo = await this.getRepoInfo(repoId);
        const ownerUsername = repo.owner?.username;
        const repoName = repo.name;
        const branch = branchName || repo.defaultBranch || "main";

        return await vcsService.getRemoteBlob(ownerUsername, repoName, branch, filePath);
    }

    /**
     * Commit a new or edited file directly into S3 and sync metadata
     */
    async commitFile(repoId, currentUserId, { branch = "main", path: filePath, content = "", message }) {
        const repo = await this.getRepoInfo(repoId);
        const user = await User.findById(currentUserId);
        const ownerUsername = repo.owner?.username;
        const repoName = repo.name;
        const targetBranch = branch || repo.defaultBranch || "main";

        const result = await vcsService.commitRemoteFile(ownerUsername, repoName, {
            path: filePath,
            content,
            message,
            author: user ? user.username : "CodeHub User",
        });

        // Sync RepoFile in MongoDB for database queries
        const fileSize = Buffer.byteLength(content, "utf8");
        const savedFile = await RepoFile.findOneAndUpdate(
            { repository: repoId, branch: targetBranch, path: result.path },
            {
                repository: repoId,
                branch: targetBranch,
                path: result.path,
                content,
                size: fileSize,
                lastCommitSha: result.sha,
                lastCommitMessage: result.message,
                lastCommitDate: new Date(),
            },
            { upsert: true, returnDocument: "after" }
        );

        // Sync Commit in MongoDB
        const newCommit = await Commit.create({
            sha: result.sha,
            message: result.message,
            author: currentUserId,
            repository: repoId,
            branch: targetBranch,
            parentSha: null,
            filesChanged: [{ path: result.path, status: "modified" }],
        });

        // Sync Branch in MongoDB
        await Branch.findOneAndUpdate(
            { repository: repoId, name: targetBranch },
            {
                name: targetBranch,
                repository: repoId,
                commitSha: result.sha,
                createdBy: currentUserId,
            },
            { upsert: true }
        );

        await Repository.findByIdAndUpdate(repoId, { updatedAt: new Date() });

        return {
            file: savedFile,
            commit: newCommit,
            ...result,
        };
    }

    /**
     * Delete a file from S3 and sync metadata
     */
    async deleteFile(repoId, currentUserId, { branch = "main", path: filePath, message }) {
        const repo = await this.getRepoInfo(repoId);
        const user = await User.findById(currentUserId);
        const ownerUsername = repo.owner?.username;
        const repoName = repo.name;
        const targetBranch = branch || repo.defaultBranch || "main";

        const result = await vcsService.deleteRemoteFile(ownerUsername, repoName, {
            path: filePath,
            message,
            author: user ? user.username : "CodeHub User",
        });

        await RepoFile.findOneAndDelete({ repository: repoId, branch: targetBranch, path: result.path });
        await Repository.findByIdAndUpdate(repoId, { updatedAt: new Date() });

        return result;
    }
}

module.exports = new FileService();
