const crypto = require("crypto");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Branch = require("../models/branchModel");
const Commit = require("../models/commitModel");
const RepoFile = require("../models/fileModel");
const Notification = require("../models/notificationModel");
const AppError = require("../utils/appError");

const vcsService = require("./vcsService");

/**
 * Repository Service
 * Encapsulates all business logic for repositories, branches, initialization, and starring.
 */
class RepoService {
    /**
     * Create a new repository
     */
    async createRepository(ownerId, { name, description = "", visibility = true, isPrivate = false, initializeReadme = true }) {
        const normalizedName = name.trim();
        const effectivePrivate = isPrivate || visibility === false;
        const effectiveVisibility = !effectivePrivate;

        const ownerUser = await User.findById(ownerId);
        if (!ownerUser) {
            throw new AppError("Owner user not found.", 404, "USER_NOT_FOUND");
        }

        // Check if repository with same name already exists for this owner
        const existing = await Repository.findOne({ owner: ownerId, name: normalizedName });
        if (existing) {
            throw new AppError(`You already have a repository named '${normalizedName}'.`, 409, "REPO_EXISTS");
        }

        const newRepo = await Repository.create({
            name: normalizedName,
            description: description.trim(),
            owner: ownerId,
            visibility: effectiveVisibility,
            isPrivate: effectivePrivate,
            defaultBranch: "main",
            content: [],
            issues: [],
            stars: [],
            starsCount: 0,
            watchers: [ownerId],
            watchersCount: 1,
            collaborators: [],
        });

        const shouldInitReadme = initializeReadme === true || initializeReadme === "true";

        // Initialize repository in S3 (custom VCS storage)
        const vcsResult = await vcsService.createRemoteRepo(ownerUser.username, normalizedName, {
            initializeReadme: shouldInitReadme,
            description: description.trim(),
        });

        // If and only if initializeReadme is true, synchronize metadata models
        if (shouldInitReadme && vcsResult.commitID) {
            const initialSha = vcsResult.commitID;
            const readmeContent = `# ${normalizedName}\n\n${description || "A new repository created on CodeHub."}\n`;

            await Branch.create({
                name: "main",
                repository: newRepo._id,
                commitSha: initialSha,
                isDefault: true,
                createdBy: ownerId,
            });

            await Commit.create({
                sha: initialSha,
                message: "Initial commit",
                author: ownerId,
                repository: newRepo._id,
                branch: "main",
                parentSha: null,
                filesChanged: [
                    {
                        path: "README.md",
                        status: "added",
                        additions: readmeContent.split("\n").length,
                        deletions: 0,
                        patch: `+${readmeContent.replace(/\n/g, "\n+")}`,
                    },
                ],
                stats: {
                    totalAdditions: readmeContent.split("\n").length,
                    totalDeletions: 0,
                    filesCount: 1,
                },
            });

            await RepoFile.create({
                repository: newRepo._id,
                branch: "main",
                path: "README.md",
                content: readmeContent,
                size: Buffer.byteLength(readmeContent, "utf8"),
                lastCommitSha: initialSha,
                lastCommitMessage: "Initial commit",
                lastCommitDate: new Date(),
            });
        }

        // Update user's repositories list
        await User.findByIdAndUpdate(ownerId, {
            $addToSet: { repositories: newRepo._id },
        });

        return newRepo;
    }

    /**
     * Fetch repository by ID with access verification
     */
    async getRepoById(repoId, currentUserId = null) {
        const repo = await Repository.findById(repoId)
            .populate("owner", "username name email avatarUrl")
            .populate("collaborators.user", "username name avatarUrl");

        if (!repo) {
            throw new AppError("Repository not found.", 404, "NOT_FOUND");
        }

        const isPublic = repo.visibility === true || repo.isPrivate === false;
        const isOwner = currentUserId && repo.owner._id.toString() === currentUserId.toString();
        const isCollaborator = currentUserId && repo.collaborators.some(
            (c) => c.user._id.toString() === currentUserId.toString()
        );

        if (!isPublic && !isOwner && !isCollaborator) {
            throw new AppError("Repository not found.", 404, "NOT_FOUND");
        }

        const isStarred = currentUserId
            ? repo.stars.some((id) => id.toString() === currentUserId.toString())
            : false;

        return {
            ...repo.toObject(),
            isStarred,
            isOwner,
        };
    }

    /**
     * Fetch repository by owner username and repo name (GitHub standard: /:owner/:repo)
     */
    async getRepoByOwnerAndName(ownerUsername, repoName, currentUserId = null) {
        const user = await User.findOne({ username: ownerUsername.toLowerCase().trim() });
        if (!user) {
            throw new AppError("Repository not found.", 404, "NOT_FOUND");
        }

        const repo = await Repository.findOne({ owner: user._id, name: repoName.trim() })
            .populate("owner", "username name email avatarUrl")
            .populate("collaborators.user", "username name avatarUrl");

        if (!repo) {
            throw new AppError("Repository not found.", 404, "NOT_FOUND");
        }

        const isPublic = repo.visibility === true || repo.isPrivate === false;
        const isOwner = currentUserId && repo.owner._id.toString() === currentUserId.toString();
        const isCollaborator = currentUserId && repo.collaborators.some(
            (c) => c.user._id.toString() === currentUserId.toString()
        );

        if (!isPublic && !isOwner && !isCollaborator) {
            throw new AppError("Repository not found.", 404, "NOT_FOUND");
        }

        const isStarred = currentUserId
            ? repo.stars.some((id) => id.toString() === currentUserId.toString())
            : false;

        return {
            ...repo.toObject(),
            isStarred,
            isOwner,
        };
    }

    /**
     * Fetch repositories for a specific user
     */
    async getUserRepositories(targetUserId, currentUserId = null) {
        const isOwner = currentUserId && currentUserId.toString() === targetUserId.toString();

        const query = { owner: targetUserId };
        if (!isOwner) {
            query.$or = [{ visibility: true }, { isPrivate: false }];
        }

        const repositories = await Repository.find(query)
            .sort({ updatedAt: -1 })
            .populate("owner", "username name avatarUrl");

        return repositories;
    }

    /**
     * Fetch all public repositories with pagination & search
     */
    async getAllRepositories({ search = "", page = 1, limit = 20 }) {
        const query = {
            $or: [{ visibility: true }, { isPrivate: false }],
        };

        if (search.trim()) {
            query.name = { $regex: search.trim(), $options: "i" };
        }

        const skip = (page - 1) * limit;

        const [repositories, total] = await Promise.all([
            Repository.find(query)
                .sort({ starsCount: -1, updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("owner", "username name avatarUrl"),
            Repository.countDocuments(query),
        ]);

        return { repositories, total, page, limit };
    }

    /**
     * Update repository settings (requires owner)
     */
    async updateRepository(repoId, currentUserId, { description, defaultBranch, topics, isPrivate, visibility }) {
        const repo = await Repository.findById(repoId);
        if (!repo) {
            throw new AppError("Repository not found.", 404, "NOT_FOUND");
        }

        if (repo.owner.toString() !== currentUserId.toString()) {
            throw new AppError("Only the repository owner can modify repository settings.", 403, "FORBIDDEN");
        }

        if (description !== undefined) repo.description = description.trim();
        if (defaultBranch !== undefined) repo.defaultBranch = defaultBranch.trim();
        if (topics !== undefined && Array.isArray(topics)) repo.topics = topics.map((t) => t.trim());

        if (visibility !== undefined) {
            repo.visibility = visibility;
            repo.isPrivate = !visibility;
        } else if (isPrivate !== undefined) {
            repo.isPrivate = isPrivate;
            repo.visibility = !isPrivate;
        }

        await repo.save();
        return repo;
    }

    /**
     * Toggle visibility (public <-> private)
     */
    async toggleVisibility(repoId, currentUserId) {
        const repo = await Repository.findById(repoId);
        if (!repo) {
            throw new AppError("Repository not found.", 404, "NOT_FOUND");
        }

        if (repo.owner.toString() !== currentUserId.toString()) {
            throw new AppError("Only the repository owner can change visibility.", 403, "FORBIDDEN");
        }

        repo.visibility = !repo.visibility;
        repo.isPrivate = !repo.visibility;
        await repo.save();

        return repo;
    }

    /**
     * Delete repository and associated branches, commits, files, and issues
     */
    async deleteRepository(repoId, currentUserId) {
        const repo = await Repository.findById(repoId).populate("owner", "username");
        if (!repo) {
            throw new AppError("Repository not found.", 404, "NOT_FOUND");
        }

        if (repo.owner._id.toString() !== currentUserId.toString()) {
            throw new AppError("Only the repository owner can delete the repository.", 403, "FORBIDDEN");
        }

        // Delete from S3 storage
        if (repo.owner && repo.owner.username) {
            try {
                await vcsService.deleteRemoteRepo(repo.owner.username, repo.name);
            } catch (err) {
                console.error("Error deleting S3 storage:", err.message);
            }
        }

        // Delete all associated entities in MongoDB
        await Promise.all([
            Repository.findByIdAndDelete(repoId),
            Branch.deleteMany({ repository: repoId }),
            Commit.deleteMany({ repository: repoId }),
            RepoFile.deleteMany({ repository: repoId }),
            User.findByIdAndUpdate(currentUserId, { $pull: { repositories: repoId } }),
        ]);

        return { message: `Repository '${repo.name}' deleted successfully.` };
    }

    /**
     * Star a repository
     */
    async starRepository(repoId, currentUserId) {
        const repo = await Repository.findById(repoId);
        if (!repo) {
            throw new AppError("Repository not found.", 404, "NOT_FOUND");
        }

        const alreadyStarred = repo.stars.some((id) => id.toString() === currentUserId.toString());
        if (!alreadyStarred) {
            repo.stars.push(currentUserId);
            repo.starsCount = repo.stars.length;
            await repo.save();

            await User.findByIdAndUpdate(currentUserId, {
                $addToSet: { starRepos: repo._id },
            });

            // Notify repo owner
            if (repo.owner.toString() !== currentUserId.toString()) {
                await Notification.create({
                    recipient: repo.owner,
                    sender: currentUserId,
                    type: "star",
                    repository: repo._id,
                });
            }
        }

        return { isStarred: true, starsCount: repo.starsCount };
    }

    /**
     * Unstar a repository
     */
    async unstarRepository(repoId, currentUserId) {
        const repo = await Repository.findById(repoId);
        if (!repo) {
            throw new AppError("Repository not found.", 404, "NOT_FOUND");
        }

        repo.stars = repo.stars.filter((id) => id.toString() !== currentUserId.toString());
        repo.starsCount = repo.stars.length;
        await repo.save();

        await User.findByIdAndUpdate(currentUserId, {
            $pull: { starRepos: repo._id },
        });

        return { isStarred: false, starsCount: repo.starsCount };
    }
}

module.exports = new RepoService();
