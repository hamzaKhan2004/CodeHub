const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { s3, S3_BUCKET } = require("../config/aws-config");
const AppError = require("../utils/appError");

/**
 * Custom Version Control System (VCS) Service
 * Single source of truth for repository data stored in AWS S3.
 * Powers both the local CLI (mygit) and the web platform API.
 */
class VCSService {
    constructor() {
        this.s3 = s3;
        this.bucket = S3_BUCKET;
    }

    /**
     * Get S3 root prefix for a specific repository
     */
    getRepoPrefix(owner, repoName) {
        const cleanOwner = (owner || "anonymous").trim().toLowerCase();
        const cleanRepo = (repoName || "unnamed").trim();
        return `repositories/${cleanOwner}/${cleanRepo}/`;
    }

    // =========================================================================
    // LOCAL CLI OPERATIONS (mygit init, add, commit, push, pull, revert)
    // =========================================================================

    /**
     * Initialize a local repository (.myGit)
     * @param {string} workDir - Current working directory
     * @param {string} [repoIdentifier] - Optional "owner/repoName" or repoName
     */
    async initLocal(workDir = process.cwd(), repoIdentifier = "") {
        const repoPath = path.resolve(workDir, ".myGit");
        const stagingPath = path.join(repoPath, "staging");
        const commitsPath = path.join(repoPath, "commits");

        await fs.mkdir(repoPath, { recursive: true });
        await fs.mkdir(stagingPath, { recursive: true });
        await fs.mkdir(commitsPath, { recursive: true });

        let owner = "";
        let repository = "";

        if (repoIdentifier) {
            const parts = repoIdentifier.split("/");
            if (parts.length >= 2) {
                owner = parts[0].trim();
                repository = parts.slice(1).join("/").trim();
            } else {
                repository = parts[0].trim();
            }
        }

        const config = {
            bucket: this.bucket,
            owner: owner,
            repository: repository,
        };

        await fs.writeFile(
            path.join(repoPath, "config.json"),
            JSON.stringify(config, null, 2)
        );

        return { repoPath, config };
    }

    /**
     * Stage files into .myGit/staging
     * @param {string} workDir
     * @param {string} targetPath - Relative path or "." for all
     */
    async addLocal(workDir = process.cwd(), targetPath = ".") {
        const repoPath = path.resolve(workDir, ".myGit");
        const stagingPath = path.join(repoPath, "staging");

        if (!fsSync.existsSync(repoPath)) {
            throw new Error("fatal: not a mygit repository (or any of the parent directories): .myGit");
        }

        await fs.mkdir(stagingPath, { recursive: true });

        const ignored = new Set([".myGit", ".git", "node_modules"]);

        if (targetPath === "." || targetPath === "") {
            // Stage everything recursively
            await this._copyRecursive(workDir, stagingPath, workDir, ignored);
            return { stagedAll: true };
        }

        const absTarget = path.resolve(workDir, targetPath);
        if (!fsSync.existsSync(absTarget)) {
            throw new Error(`pathspec '${targetPath}' did not match any files`);
        }

        const relPath = path.relative(workDir, absTarget);
        const destPath = path.join(stagingPath, relPath);

        const stat = await fs.stat(absTarget);
        if (stat.isDirectory()) {
            await this._copyRecursive(absTarget, destPath, absTarget, ignored);
        } else {
            await fs.mkdir(path.dirname(destPath), { recursive: true });
            await fs.copyFile(absTarget, destPath);
        }

        return { stagedPath: relPath };
    }

    /**
     * Commit staged files into .myGit/commits/<commitID>
     * @param {string} workDir
     * @param {string} message
     */
    async commitLocal(workDir = process.cwd(), message) {
        if (!message || !message.trim()) {
            throw new Error("Commit message is required.");
        }

        const repoPath = path.resolve(workDir, ".myGit");
        const stagingPath = path.join(repoPath, "staging");
        const commitsPath = path.join(repoPath, "commits");

        if (!fsSync.existsSync(repoPath)) {
            throw new Error("fatal: not a mygit repository: .myGit");
        }

        const stagedFiles = fsSync.existsSync(stagingPath) ? await fs.readdir(stagingPath) : [];
        if (stagedFiles.length === 0) {
            throw new Error("no changes added to commit (use 'mygit add' to track)");
        }

        const commitID = uuidv4();
        const commitDir = path.join(commitsPath, commitID);
        await fs.mkdir(commitDir, { recursive: true });

        // Copy everything from staging into the commit directory
        await this._copyRecursive(stagingPath, commitDir, stagingPath);

        // Write commit.json
        const commitMeta = {
            commitID,
            message: message.trim(),
            date: new Date().toISOString(),
            author: process.env.MYGIT_USER || "CodeHub User",
        };

        await fs.writeFile(
            path.join(commitDir, "commit.json"),
            JSON.stringify(commitMeta, null, 2)
        );

        // Update local HEAD pointer
        await fs.writeFile(path.join(repoPath, "HEAD"), commitID);

        // Clear staging
        await fs.rm(stagingPath, { recursive: true, force: true });
        await fs.mkdir(stagingPath, { recursive: true });

        return { commitID, message: commitMeta.message };
    }

    /**
     * Push local commits and HEAD to AWS S3
     * @param {string} workDir
     * @param {string} [remoteOverride] - e.g. "hamza/Test_3"
     * @param {string} [branch]
     */
    async pushLocal(workDir = process.cwd(), remoteOverride, branch = "main") {
        const repoPath = path.resolve(workDir, ".myGit");
        const commitsPath = path.join(repoPath, "commits");

        if (!fsSync.existsSync(repoPath)) {
            throw new Error("fatal: not a mygit repository: .myGit");
        }

        // Read config.json to resolve repository target
        let owner = "";
        let repoName = "";

        const configPath = path.join(repoPath, "config.json");
        if (fsSync.existsSync(configPath)) {
            try {
                const conf = JSON.parse(await fs.readFile(configPath, "utf-8"));
                owner = conf.owner || "";
                repoName = conf.repository || "";
            } catch {}
        }

        if (remoteOverride) {
            const parts = remoteOverride.split("/");
            if (parts.length >= 2) {
                owner = parts[0].trim();
                repoName = parts.slice(1).join("/").trim();
            } else {
                repoName = parts[0].trim();
            }
        }

        if (!repoName) {
            throw new Error("fatal: no repository configured. Run 'mygit init <owner>/<repoName>' or provide 'mygit push <owner>/<repoName>'");
        }

        const prefix = this.getRepoPrefix(owner, repoName);

        if (!fsSync.existsSync(commitsPath)) {
            throw new Error("No commits to push.");
        }

        const commitDirs = await fs.readdir(commitsPath);
        if (commitDirs.length === 0) {
            throw new Error("No commits found to push. Create a commit first using 'mygit commit'.");
        }

        // Upload all commits and their files to S3
        let filesUploaded = 0;
        for (const commitId of commitDirs) {
            const commitDir = path.join(commitsPath, commitId);
            const stat = await fs.stat(commitDir);
            if (!stat.isDirectory()) continue;

            const allFiles = await this._collectAllFiles(commitDir, commitDir);

            for (const relFile of allFiles) {
                const fullPath = path.join(commitDir, relFile);
                const fileContent = await fs.readFile(fullPath);

                const s3Key = `${prefix}commits/${commitId}/${relFile.replace(/\\/g, "/")}`;

                await this.s3.upload({
                    Bucket: this.bucket,
                    Key: s3Key,
                    Body: fileContent,
                }).promise();

                filesUploaded++;
            }
        }

        // Update S3 HEAD pointer to current local HEAD (or latest commit)
        let headCommitId = "";
        const headPath = path.join(repoPath, "HEAD");
        if (fsSync.existsSync(headPath)) {
            headCommitId = (await fs.readFile(headPath, "utf-8")).trim();
        } else {
            headCommitId = commitDirs[commitDirs.length - 1];
        }

        await this.s3.upload({
            Bucket: this.bucket,
            Key: `${prefix}HEAD`,
            Body: headCommitId,
        }).promise();

        return {
            owner,
            repoName,
            headCommitId,
            commitsCount: commitDirs.length,
            filesUploaded,
        };
    }

    /**
     * Pull remote repository commits from S3
     */
    async pullLocal(workDir = process.cwd(), remoteOverride, branch = "main") {
        const repoPath = path.resolve(workDir, ".myGit");
        const commitsPath = path.join(repoPath, "commits");

        let owner = "";
        let repoName = "";

        const configPath = path.join(repoPath, "config.json");
        if (fsSync.existsSync(configPath)) {
            try {
                const conf = JSON.parse(await fs.readFile(configPath, "utf-8"));
                owner = conf.owner || "";
                repoName = conf.repository || "";
            } catch {}
        }

        if (remoteOverride) {
            const parts = remoteOverride.split("/");
            if (parts.length >= 2) {
                owner = parts[0].trim();
                repoName = parts.slice(1).join("/").trim();
            } else {
                repoName = parts[0].trim();
            }
        }

        const prefix = this.getRepoPrefix(owner, repoName);

        // Fetch HEAD
        let headCommitId = "";
        try {
            const headObj = await this.s3.getObject({
                Bucket: this.bucket,
                Key: `${prefix}HEAD`,
            }).promise();
            headCommitId = headObj.Body.toString("utf-8").trim();
        } catch {
            throw new Error(`Repository ${owner}/${repoName} is empty or does not exist on S3.`);
        }

        // List all objects under commits/
        const data = await this.s3.listObjectsV2({
            Bucket: this.bucket,
            Prefix: `${prefix}commits/`,
        }).promise();

        const objects = data.Contents || [];
        for (const obj of objects) {
            const relToPrefix = obj.Key.slice(prefix.length); // e.g. "commits/<commitID>/file.txt"
            const localDest = path.join(repoPath, relToPrefix);

            await fs.mkdir(path.dirname(localDest), { recursive: true });

            const fileData = await this.s3.getObject({
                Bucket: this.bucket,
                Key: obj.Key,
            }).promise();

            await fs.writeFile(localDest, fileData.Body);
        }

        // Update local HEAD
        await fs.writeFile(path.join(repoPath, "HEAD"), headCommitId);

        // Check out latest commit files into working directory (excluding commit.json)
        const latestCommitDir = path.join(commitsPath, headCommitId);
        if (fsSync.existsSync(latestCommitDir)) {
            const commitFiles = await this._collectAllFiles(latestCommitDir, latestCommitDir);
            for (const f of commitFiles) {
                if (f === "commit.json") continue;
                const src = path.join(latestCommitDir, f);
                const dst = path.join(workDir, f);
                await fs.mkdir(path.dirname(dst), { recursive: true });
                await fs.copyFile(src, dst);
            }
        }

        return { headCommitId, filesPulled: objects.length };
    }

    /**
     * Revert local repository to a specific commit
     */
    async revertLocal(workDir = process.cwd(), commitID) {
        const repoPath = path.resolve(workDir, ".myGit");
        const commitsPath = path.join(repoPath, "commits");
        const commitDir = path.join(commitsPath, commitID);

        if (!fsSync.existsSync(commitDir)) {
            throw new Error(`Commit '${commitID}' not found in local repository.`);
        }

        const files = await this._collectAllFiles(commitDir, commitDir);
        for (const file of files) {
            if (file === "commit.json") continue;
            const src = path.join(commitDir, file);
            const dst = path.join(workDir, file);
            await fs.mkdir(path.dirname(dst), { recursive: true });
            await fs.copyFile(src, dst);
        }

        await fs.writeFile(path.join(repoPath, "HEAD"), commitID);
        return { revertedTo: commitID, restoredFiles: files.filter((f) => f !== "commit.json") };
    }

    // =========================================================================
    // REMOTE S3 OPERATIONS (Backend API Source of Truth for Frontend)
    // =========================================================================

    /**
     * Initialize repository in S3 (called when web repository is created)
     * @param {string} owner
     * @param {string} repoName
     * @param {Object} options - { initializeReadme, description }
     */
    async createRemoteRepo(owner, repoName, { initializeReadme = false, description = "" }) {
        const prefix = this.getRepoPrefix(owner, repoName);

        if (!initializeReadme) {
            // Leave S3 completely empty (genuinely empty repository)
            return { isEmpty: true, commitID: null };
        }

        // Initialize with README.md custom commit
        const commitID = uuidv4();
        const readmeContent = `# ${repoName}\n\n${description || "A new repository created on CodeHub."}\n`;

        const commitMeta = {
            commitID,
            message: "Initial commit",
            date: new Date().toISOString(),
            author: owner,
        };

        // 1. Upload README.md
        await this.s3.upload({
            Bucket: this.bucket,
            Key: `${prefix}commits/${commitID}/README.md`,
            Body: Buffer.from(readmeContent, "utf-8"),
        }).promise();

        // 2. Upload commit.json
        await this.s3.upload({
            Bucket: this.bucket,
            Key: `${prefix}commits/${commitID}/commit.json`,
            Body: Buffer.from(JSON.stringify(commitMeta, null, 2), "utf-8"),
        }).promise();

        // 3. Set HEAD pointer in S3
        await this.s3.upload({
            Bucket: this.bucket,
            Key: `${prefix}HEAD`,
            Body: commitID,
        }).promise();

        return { isEmpty: false, commitID };
    }

    /**
     * Fetch the file tree and latest commit from S3 for the frontend
     */
    async getRemoteTree(owner, repoName, branch = "main", subPath = "") {
        const prefix = this.getRepoPrefix(owner, repoName);

        // 1. Fetch current HEAD commit ID
        let headCommitId = null;
        try {
            const headObj = await this.s3.getObject({
                Bucket: this.bucket,
                Key: `${prefix}HEAD`,
            }).promise();
            headCommitId = headObj.Body.toString("utf-8").trim();
        } catch (err) {
            if (err.code === "NoSuchKey" || err.statusCode === 404) {
                return { tree: [], latestCommit: null, readme: null, isEmpty: true };
            }
            throw err;
        }

        if (!headCommitId) {
            return { tree: [], latestCommit: null, readme: null, isEmpty: true };
        }

        // 2. Fetch commit.json for metadata
        let latestCommit = null;
        try {
            const metaObj = await this.s3.getObject({
                Bucket: this.bucket,
                Key: `${prefix}commits/${headCommitId}/commit.json`,
            }).promise();
            const meta = JSON.parse(metaObj.Body.toString("utf-8"));
            latestCommit = {
                sha: meta.commitID || headCommitId,
                message: meta.message || "Commit",
                createdAt: meta.date || new Date().toISOString(),
                author: {
                    username: meta.author || owner,
                },
            };
        } catch {
            latestCommit = {
                sha: headCommitId,
                message: "Update repository",
                createdAt: new Date().toISOString(),
                author: { username: owner },
            };
        }

        // 3. List all files in the active commit
        const commitPrefix = `${prefix}commits/${headCommitId}/`;
        const listData = await this.s3.listObjectsV2({
            Bucket: this.bucket,
            Prefix: commitPrefix,
        }).promise();

        const allObjects = listData.Contents || [];
        const filesMap = new Map();
        let readmeObj = null;

        const normalizedSub = subPath ? subPath.replace(/^\/+|\/+$/g, "") + "/" : "";

        for (const obj of allObjects) {
            const fullRelPath = obj.Key.slice(commitPrefix.length); // e.g. "src/index.js" or "README.md"
            if (!fullRelPath || fullRelPath === "commit.json") continue;

            // Check if this file is README.md at root
            if (fullRelPath.toLowerCase() === "readme.md") {
                readmeObj = obj;
            }

            // Filter by subPath
            if (normalizedSub && !fullRelPath.startsWith(normalizedSub)) {
                continue;
            }

            const pathAfterSub = normalizedSub ? fullRelPath.slice(normalizedSub.length) : fullRelPath;
            const segments = pathAfterSub.split("/");

            if (segments.length === 1) {
                // Direct file in current directory
                filesMap.set(segments[0], {
                    path: fullRelPath,
                    name: segments[0],
                    type: "file",
                    size: obj.Size,
                    lastCommitMessage: latestCommit?.message || "Initial commit",
                    lastCommitDate: latestCommit?.createdAt || obj.LastModified,
                });
            } else {
                // Directory in current directory
                const dirName = segments[0];
                const dirRelPath = normalizedSub ? `${normalizedSub}${dirName}` : dirName;

                if (!filesMap.has(dirName)) {
                    filesMap.set(dirName, {
                        path: dirRelPath,
                        name: dirName,
                        type: "dir",
                        size: 0,
                        lastCommitMessage: latestCommit?.message || "Initial commit",
                        lastCommitDate: latestCommit?.createdAt || obj.LastModified,
                    });
                }
            }
        }

        // Sort: directories first, then files alphabetically
        const tree = Array.from(filesMap.values()).sort((a, b) => {
            if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        // 4. Fetch README content if present
        let readme = null;
        if (readmeObj) {
            try {
                const readContent = await this.s3.getObject({
                    Bucket: this.bucket,
                    Key: readmeObj.Key,
                }).promise();
                readme = {
                    path: "README.md",
                    content: readContent.Body.toString("utf-8"),
                };
            } catch {}
        }

        return {
            tree,
            latestCommit,
            readme,
            isEmpty: tree.length === 0 && !latestCommit,
        };
    }

    /**
     * Fetch a single file's content from S3
     */
    async getRemoteBlob(owner, repoName, branch = "main", filePath = "") {
        const prefix = this.getRepoPrefix(owner, repoName);

        const headObj = await this.s3.getObject({
            Bucket: this.bucket,
            Key: `${prefix}HEAD`,
        }).promise();
        const headCommitId = headObj.Body.toString("utf-8").trim();

        // 1. Normalize and URL-decode the incoming file path
        let cleanPath = decodeURIComponent(filePath || "")
            .replace(/^(\.\/|\.\\|\/|\\)+/, "")
            .replace(/\\/g, "/");

        // 2. If cleanPath accidentally starts with `${branch}/`, strip it (e.g. "main/src/index.js" -> "src/index.js")
        if (cleanPath.startsWith(`${branch}/`)) {
            cleanPath = cleanPath.slice(branch.length + 1);
        }

        const fileKey = `${prefix}commits/${headCommitId}/${cleanPath}`;

        console.log(
            `[VCS S3 Blob] Repository: ${owner}/${repoName}, Branch: ${branch}, Commit: ${headCommitId}, Path: ${cleanPath}, Resolved S3 key: ${fileKey}`
        );

        try {
            const fileObj = await this.s3.getObject({
                Bucket: this.bucket,
                Key: fileKey,
            }).promise();

            return {
                content: fileObj.Body.toString("utf-8"),
                path: cleanPath,
                size: fileObj.ContentLength,
                commitSha: headCommitId,
            };
        } catch (err) {
            console.warn(
                `[VCS S3 Blob Error] Repository: ${owner}/${repoName}, Branch: ${branch}, Commit: ${headCommitId}, Path: ${cleanPath}, S3 Key: ${fileKey}, Error: ${err.message}`
            );

            // Fallback attempt: if cleanPath differed from the raw filePath, attempt raw lookup
            const rawClean = (filePath || "").replace(/^(\.\/|\.\\|\/|\\)+/, "").replace(/\\/g, "/");
            if (rawClean && rawClean !== cleanPath) {
                const altKey = `${prefix}commits/${headCommitId}/${rawClean}`;
                try {
                    const altObj = await this.s3.getObject({
                        Bucket: this.bucket,
                        Key: altKey,
                    }).promise();
                    return {
                        content: altObj.Body.toString("utf-8"),
                        path: rawClean,
                        size: altObj.ContentLength,
                        commitSha: headCommitId,
                    };
                } catch (_) {}
            }

            throw err;
        }
    }

    /**
     * Get commit history from S3
     */
    async getRemoteCommits(owner, repoName, branch = "main") {
        const prefix = this.getRepoPrefix(owner, repoName);
        const commitsPrefix = `${prefix}commits/`;

        const listData = await this.s3.listObjectsV2({
            Bucket: this.bucket,
            Prefix: commitsPrefix,
        }).promise();

        const objects = listData.Contents || [];
        const commitJsons = objects.filter((o) => o.Key.endsWith("/commit.json"));

        const commits = [];
        for (const metaObj of commitJsons) {
            try {
                const data = await this.s3.getObject({
                    Bucket: this.bucket,
                    Key: metaObj.Key,
                }).promise();

                const meta = JSON.parse(data.Body.toString("utf-8"));
                commits.push({
                    sha: meta.commitID,
                    message: meta.message,
                    createdAt: meta.date,
                    author: {
                        username: meta.author || owner,
                    },
                });
            } catch {}
        }

        commits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return { commits };
    }

    /**
     * Delete all remote objects for a repository from S3
     */
    async deleteRemoteRepo(owner, repoName) {
        const prefix = this.getRepoPrefix(owner, repoName);

        const data = await this.s3.listObjectsV2({
            Bucket: this.bucket,
            Prefix: prefix,
        }).promise();

        const objects = data.Contents || [];
        if (objects.length === 0) return { deletedCount: 0 };

        const deleteParams = {
            Bucket: this.bucket,
            Delete: {
                Objects: objects.map((o) => ({ Key: o.Key })),
            },
        };

        await this.s3.deleteObjects(deleteParams).promise();
        return { deletedCount: objects.length };
    }

    /**
     * Commit a new or updated file directly to S3 (web editor)
     */
    async commitRemoteFile(owner, repoName, { path: filePath, content, message, author = "CodeHub User" }) {
        const prefix = this.getRepoPrefix(owner, repoName);
        const cleanPath = filePath.replace(/^\/+/, "");
        const newCommitId = uuidv4();

        // 1. Get previous HEAD commit if any
        let prevCommitId = null;
        try {
            const headObj = await this.s3.getObject({
                Bucket: this.bucket,
                Key: `${prefix}HEAD`,
            }).promise();
            prevCommitId = headObj.Body.toString("utf-8").trim();
        } catch {}

        // 2. If previous commit exists, copy its files over to new commit
        if (prevCommitId) {
            const prevPrefix = `${prefix}commits/${prevCommitId}/`;
            const prevList = await this.s3.listObjectsV2({
                Bucket: this.bucket,
                Prefix: prevPrefix,
            }).promise();

            for (const item of prevList.Contents || []) {
                const relFile = item.Key.slice(prevPrefix.length);
                if (relFile === "commit.json" || relFile === cleanPath) continue;

                await this.s3.copyObject({
                    Bucket: this.bucket,
                    CopySource: `${this.bucket}/${item.Key}`,
                    Key: `${prefix}commits/${newCommitId}/${relFile}`,
                }).promise();
            }
        }

        // 3. Upload the new/modified file
        await this.s3.upload({
            Bucket: this.bucket,
            Key: `${prefix}commits/${newCommitId}/${cleanPath}`,
            Body: Buffer.from(content, "utf-8"),
        }).promise();

        // 4. Upload commit.json
        const commitMeta = {
            commitID: newCommitId,
            message: message || `Update ${cleanPath}`,
            date: new Date().toISOString(),
            author,
        };

        await this.s3.upload({
            Bucket: this.bucket,
            Key: `${prefix}commits/${newCommitId}/commit.json`,
            Body: Buffer.from(JSON.stringify(commitMeta, null, 2), "utf-8"),
        }).promise();

        // 5. Update S3 HEAD
        await this.s3.upload({
            Bucket: this.bucket,
            Key: `${prefix}HEAD`,
            Body: newCommitId,
        }).promise();

        return {
            sha: newCommitId,
            path: cleanPath,
            message: commitMeta.message,
        };
    }

    /**
     * Delete a file from remote repository in S3 (web editor)
     */
    async deleteRemoteFile(owner, repoName, { path: filePath, message, author = "CodeHub User" }) {
        const prefix = this.getRepoPrefix(owner, repoName);
        const cleanPath = filePath.replace(/^\/+/, "");
        const newCommitId = uuidv4();

        let prevCommitId = null;
        try {
            const headObj = await this.s3.getObject({
                Bucket: this.bucket,
                Key: `${prefix}HEAD`,
            }).promise();
            prevCommitId = headObj.Body.toString("utf-8").trim();
        } catch {}

        if (!prevCommitId) {
            throw new AppError("Repository is empty; no files to delete.", 400);
        }

        const prevPrefix = `${prefix}commits/${prevCommitId}/`;
        const prevList = await this.s3.listObjectsV2({
            Bucket: this.bucket,
            Prefix: prevPrefix,
        }).promise();

        for (const item of prevList.Contents || []) {
            const relFile = item.Key.slice(prevPrefix.length);
            if (relFile === "commit.json" || relFile === cleanPath) continue;

            await this.s3.copyObject({
                Bucket: this.bucket,
                CopySource: `${this.bucket}/${item.Key}`,
                Key: `${prefix}commits/${newCommitId}/${relFile}`,
            }).promise();
        }

        const commitMeta = {
            commitID: newCommitId,
            message: message || `Delete ${cleanPath}`,
            date: new Date().toISOString(),
            author,
        };

        await this.s3.upload({
            Bucket: this.bucket,
            Key: `${prefix}commits/${newCommitId}/commit.json`,
            Body: Buffer.from(JSON.stringify(commitMeta, null, 2), "utf-8"),
        }).promise();

        await this.s3.upload({
            Bucket: this.bucket,
            Key: `${prefix}HEAD`,
            Body: newCommitId,
        }).promise();

        return {
            sha: newCommitId,
            path: cleanPath,
            message: commitMeta.message,
        };
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    async _copyRecursive(srcDir, destDir, baseDir, ignored = new Set()) {
        const entries = await fs.readdir(srcDir, { withFileTypes: true });

        for (const entry of entries) {
            if (ignored.has(entry.name)) continue;

            const srcPath = path.join(srcDir, entry.name);
            const destPath = path.join(destDir, entry.name);

            if (entry.isDirectory()) {
                await fs.mkdir(destPath, { recursive: true });
                await this._copyRecursive(srcPath, destPath, baseDir, ignored);
            } else {
                await fs.mkdir(path.dirname(destPath), { recursive: true });
                await fs.copyFile(srcPath, destPath);
            }
        }
    }

    async _collectAllFiles(currentDir, baseDir) {
        const results = [];
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const full = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                const sub = await this._collectAllFiles(full, baseDir);
                results.push(...sub);
            } else {
                results.push(path.relative(baseDir, full));
            }
        }

        return results;
    }
}

module.exports = new VCSService();
