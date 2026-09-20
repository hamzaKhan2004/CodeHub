const crypto = require("crypto");
const RepoFile = require("../models/fileModel");
const Commit = require("../models/commitModel");
const Branch = require("../models/branchModel");
const Repository = require("../models/repoModel");
const AppError = require("../utils/appError");

/**
 * File & Tree Service
 * Handles code browsing, directory trees, file reading, and committing file edits/creations.
 */
class FileService {
    /**
     * Clean and normalize repository file paths
     */
    cleanPath(rawPath) {
        if (!rawPath) return "";
        let cleaned = rawPath.replace(/\\/g, "/").trim();
        // Prevent path traversal
        cleaned = cleaned.replace(/\.\./g, "");
        // Remove leading/trailing slashes
        cleaned = cleaned.replace(/^\/+|\/+$/g, "");
        return cleaned;
    }

    /**
     * List files and folders for a given repository, branch, and directory path
     */
    async getFileTree(repoId, branchName = "main", dirPath = "") {
        const normalizedDir = this.cleanPath(dirPath);

        // Find all files on this branch for the repository
        const allFiles = await RepoFile.find({ repository: repoId, branch: branchName });

        const itemsMap = new Map();

        allFiles.forEach((file) => {
            const filePath = file.path;

            // If we are inspecting root (normalizedDir is empty)
            if (!normalizedDir) {
                const parts = filePath.split("/");
                const topName = parts[0];
                const isDir = parts.length > 1;

                if (!itemsMap.has(topName)) {
                    itemsMap.set(topName, {
                        name: topName,
                        path: topName,
                        type: isDir ? "dir" : "file",
                        size: isDir ? 0 : file.size,
                        lastCommitMessage: file.lastCommitMessage,
                        lastCommitDate: file.lastCommitDate,
                    });
                }
            } else {
                // If we are inspecting a specific folder, check if file starts with that folder
                if (filePath.startsWith(normalizedDir + "/")) {
                    const relative = filePath.slice(normalizedDir.length + 1);
                    const parts = relative.split("/");
                    const topName = parts[0];
                    const isDir = parts.length > 1;
                    const itemPath = `${normalizedDir}/${topName}`;

                    if (!itemsMap.has(topName)) {
                        itemsMap.set(topName, {
                            name: topName,
                            path: itemPath,
                            type: isDir ? "dir" : "file",
                            size: isDir ? 0 : file.size,
                            lastCommitMessage: file.lastCommitMessage,
                            lastCommitDate: file.lastCommitDate,
                        });
                    }
                }
            }
        });

        // Sort directories first, then files alphabetically
        const tree = Array.from(itemsMap.values()).sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === "dir" ? -1 : 1;
        });

        // Also check if there is a README.md in the current directory or root to preview
        let readme = null;
        const readmePath = normalizedDir ? `${normalizedDir}/README.md` : "README.md";
        const readmeFile = allFiles.find((f) => f.path.toLowerCase() === readmePath.toLowerCase());
        if (readmeFile) {
            readme = {
                path: readmeFile.path,
                content: readmeFile.content,
            };
        }

        // Get latest commit for the branch
        const branch = await Branch.findOne({ repository: repoId, name: branchName });
        let latestCommit = null;
        if (branch && branch.commitSha) {
            latestCommit = await Commit.findOne({ sha: branch.commitSha }).populate("author", "username name avatarUrl");
        }

        return {
            branch: branchName,
            currentPath: normalizedDir,
            tree,
            readme,
            latestCommit,
        };
    }

    /**
     * Get single file content and metadata
     */
    async getFileContent(repoId, branchName = "main", filePath) {
        const normalizedPath = this.cleanPath(filePath);

        const file = await RepoFile.findOne({
            repository: repoId,
            branch: branchName,
            path: normalizedPath,
        });

        if (!file) {
            throw new AppError(`File '${normalizedPath}' not found on branch '${branchName}'.`, 404, "FILE_NOT_FOUND");
        }

        // Get last commit that modified this file
        let lastCommit = null;
        if (file.lastCommitSha) {
            lastCommit = await Commit.findOne({ sha: file.lastCommitSha }).populate("author", "username name avatarUrl");
        }

        return {
            path: file.path,
            content: file.content,
            size: file.size,
            branch: branchName,
            lastCommit,
        };
    }

    /**
     * Create or edit a file and generate a commit
     */
    async commitFile(repoId, currentUserId, { branch = "main", path: filePath, content = "", message }) {
        const normalizedPath = this.cleanPath(filePath);
        if (!normalizedPath) {
            throw new AppError("A valid file path is required.", 400, "INVALID_PATH");
        }

        const commitMessage = (message || `Update ${normalizedPath}`).trim();

        // 1. Ensure branch exists
        let branchDoc = await Branch.findOne({ repository: repoId, name: branch });
        if (!branchDoc) {
            // If branch doesn't exist, create it
            branchDoc = await Branch.create({
                name: branch,
                repository: repoId,
                createdBy: currentUserId,
            });
        }

        // 2. Check if file already exists
        const existingFile = await RepoFile.findOne({
            repository: repoId,
            branch,
            path: normalizedPath,
        });

        const isNewFile = !existingFile;
        const previousContent = existingFile ? existingFile.content : "";
        const oldLines = previousContent ? previousContent.split("\n") : [];
        const newLines = content ? content.split("\n") : [];

        const additions = isNewFile ? newLines.length : Math.max(0, newLines.length - oldLines.length) + 1;
        const deletions = isNewFile ? 0 : Math.max(0, oldLines.length - newLines.length);

        // 3. Generate new commit SHA
        const commitSha = crypto.randomBytes(20).toString("hex");
        const parentSha = branchDoc.commitSha || null;

        // 4. Save/Update RepoFile
        const fileSize = Buffer.byteLength(content, "utf8");
        let savedFile;

        if (existingFile) {
            existingFile.content = content;
            existingFile.size = fileSize;
            existingFile.lastCommitSha = commitSha;
            existingFile.lastCommitMessage = commitMessage;
            existingFile.lastCommitDate = new Date();
            savedFile = await existingFile.save();
        } else {
            savedFile = await RepoFile.create({
                repository: repoId,
                branch,
                path: normalizedPath,
                content,
                size: fileSize,
                lastCommitSha: commitSha,
                lastCommitMessage: commitMessage,
                lastCommitDate: new Date(),
            });
        }

        // 5. Create Commit record
        const newCommit = await Commit.create({
            sha: commitSha,
            message: commitMessage,
            author: currentUserId,
            repository: repoId,
            branch,
            parentSha,
            filesChanged: [
                {
                    path: normalizedPath,
                    status: isNewFile ? "added" : "modified",
                    additions,
                    deletions,
                    patch: `+${content.substring(0, 1000)}`,
                },
            ],
            stats: {
                totalAdditions: additions,
                totalDeletions: deletions,
                filesCount: 1,
            },
        });

        // 6. Update branch commit SHA
        branchDoc.commitSha = commitSha;
        await branchDoc.save();

        // 7. Update repository timestamp
        await Repository.findByIdAndUpdate(repoId, { updatedAt: new Date() });

        return {
            file: savedFile,
            commit: newCommit,
        };
    }

    /**
     * Delete a file and generate a deletion commit
     */
    async deleteFile(repoId, currentUserId, { branch = "main", path: filePath, message }) {
        const normalizedPath = this.cleanPath(filePath);

        const existingFile = await RepoFile.findOne({
            repository: repoId,
            branch,
            path: normalizedPath,
        });

        if (!existingFile) {
            throw new AppError(`File '${normalizedPath}' does not exist on branch '${branch}'.`, 404, "FILE_NOT_FOUND");
        }

        const commitMessage = (message || `Delete ${normalizedPath}`).trim();
        const branchDoc = await Branch.findOne({ repository: repoId, name: branch });
        const parentSha = branchDoc ? branchDoc.commitSha : null;
        const commitSha = crypto.randomBytes(20).toString("hex");

        // Delete the file document
        await RepoFile.findByIdAndDelete(existingFile._id);

        // Record deletion commit
        const deletionCommit = await Commit.create({
            sha: commitSha,
            message: commitMessage,
            author: currentUserId,
            repository: repoId,
            branch,
            parentSha,
            filesChanged: [
                {
                    path: normalizedPath,
                    status: "deleted",
                    additions: 0,
                    deletions: existingFile.content.split("\n").length,
                },
            ],
            stats: {
                totalAdditions: 0,
                totalDeletions: existingFile.content.split("\n").length,
                filesCount: 1,
            },
        });

        if (branchDoc) {
            branchDoc.commitSha = commitSha;
            await branchDoc.save();
        }

        return { commit: deletionCommit };
    }
}

module.exports = new FileService();
