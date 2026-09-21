require("dotenv").config();
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const mongoose = require("mongoose");
const { createApp } = require("../index");

// Models for verification and cleanup
const User = require("../models/userModel");
const Repository = require("../models/repoModel");
const Branch = require("../models/branchModel");
const RepoFile = require("../models/fileModel");
const Commit = require("../models/commitModel");
const Issue = require("../models/issueModel");
const PullRequest = require("../models/pullRequestModel");
const Comment = require("../models/commentModel");
const Notification = require("../models/notificationModel");

const app = createApp();

const timestamp = Date.now();
const user1Data = {
    username: `dev_alice_${timestamp}`,
    email: `alice_${timestamp}@testcodehub.io`,
    password: "Password123!",
};

const user2Data = {
    username: `dev_bob_${timestamp}`,
    email: `bob_${timestamp}@testcodehub.io`,
    password: "Password123!",
};

let user1Token = "";
let user1Id = "";
let user2Token = "";
let user2Id = "";
let repo1Id = "";
let repo2Id = "";
let issue1Id = "";
let pr1Id = "";

describe("CodeHub Full API Integration Suite", { concurrency: 1 }, () => {
    before(async () => {
        process.env.NODE_ENV = "test";
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
        }
    });

    after(async () => {
        // Cleanup all entities created during this test run
        try {
            const repoIds = [repo1Id, repo2Id].filter(Boolean);
            const userIds = [user1Id, user2Id].filter(Boolean);

            if (userIds.length > 0) {
                await User.deleteMany({ _id: { $in: userIds } });
                await Notification.deleteMany({ recipient: { $in: userIds } });
            }
            if (repoIds.length > 0) {
                await Repository.deleteMany({ _id: { $in: repoIds } });
                await Branch.deleteMany({ repository: { $in: repoIds } });
                await RepoFile.deleteMany({ repository: { $in: repoIds } });
                await Commit.deleteMany({ repository: { $in: repoIds } });
                await Issue.deleteMany({ repository: { $in: repoIds } });
                await PullRequest.deleteMany({ repository: { $in: repoIds } });
                await Comment.deleteMany({ repository: { $in: repoIds } });
            }
        } catch (e) {
            console.error("Cleanup error:", e.message);
        }
        await mongoose.disconnect();
    });

    // 1. Health & Meta
    describe("1. System Health & Metadata", { concurrency: 1 }, () => {
        it("GET /health should return 200 and healthy status", async () => {
            const res = await request(app).get("/health");
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.status, "healthy");
        });

        it("GET /api should return API welcome message", async () => {
            const res = await request(app).get("/api");
            assert.strictEqual(res.status, 200);
            assert.ok(res.body.version);
        });
    });

    // 2. Authentication & Profiles
    describe("2. Authentication & Profiles", { concurrency: 1 }, () => {
        it("POST /api/signup should register User 1 successfully", async () => {
            const res = await request(app)
                .post("/api/signup")
                .send(user1Data);
            assert.strictEqual(res.status, 201);
            assert.ok(res.body.data.token);
            assert.strictEqual(res.body.data.user.username, user1Data.username);
            user1Token = res.body.data.token;
            user1Id = res.body.data.user._id;
        });

        it("POST /api/signup should register User 2 successfully", async () => {
            const res = await request(app)
                .post("/api/signup")
                .send(user2Data);
            assert.strictEqual(res.status, 201);
            assert.ok(res.body.data.token);
            assert.strictEqual(res.body.data.user.username, user2Data.username);
            user2Token = res.body.data.token;
            user2Id = res.body.data.user._id;
        });

        it("POST /api/signup should reject duplicate username with 409 Conflict", async () => {
            const res = await request(app)
                .post("/api/signup")
                .send({
                    username: user1Data.username,
                    email: `other_${timestamp}@testcodehub.io`,
                    password: "Password123!",
                });
            assert.strictEqual(res.status, 409);
        });

        it("POST /api/login should reject invalid credentials with 401 Unauthorized", async () => {
            const res = await request(app)
                .post("/api/login")
                .send({
                    email: user1Data.email,
                    password: "WrongPassword!",
                });
            assert.strictEqual(res.status, 401);
        });

        it("POST /api/login should authenticate with valid credentials", async () => {
            const res = await request(app)
                .post("/api/login")
                .send({
                    email: user1Data.email,
                    password: user1Data.password,
                });
            assert.strictEqual(res.status, 200);
            assert.ok(res.body.data.token);
            assert.strictEqual(res.body.data.user.username, user1Data.username);
        });

        it("GET /api/me should return authenticated user profile", async () => {
            const res = await request(app)
                .get("/api/me")
                .set("Authorization", `Bearer ${user1Token}`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.data.user.username, user1Data.username);
        });

        it("PUT /api/updateProfile/:id should update user bio", async () => {
            const res = await request(app)
                .put(`/api/updateProfile/${user1Id}`)
                .set("Authorization", `Bearer ${user1Token}`)
                .send({ bio: "Full Stack Engineer & Open Source Contributor" });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.data.user.bio, "Full Stack Engineer & Open Source Contributor");
        });
    });

    // 3. Repository Creation & Compound Indexing
    describe("3. Repository Management", { concurrency: 1 }, () => {
        const repoName = `awesome-web-app-${timestamp}`;

        it("POST /api/repo/create should create a repository with auto-initialized main branch and README", async () => {
            const res = await request(app)
                .post("/api/repo/create")
                .set("Authorization", `Bearer ${user1Token}`)
                .send({
                    name: repoName,
                    description: "An awesome production repository",
                    visibility: true,
                });
            assert.strictEqual(res.status, 201);
            const repo = res.body.data.repository || res.body.data;
            assert.ok(repo._id);
            assert.strictEqual(repo.name, repoName);
            assert.strictEqual(repo.defaultBranch, "main");
            repo1Id = repo._id;
        });

        it("Compound Index: User 2 can create a repository with the SAME name as User 1", async () => {
            const res = await request(app)
                .post("/api/repo/create")
                .set("Authorization", `Bearer ${user2Token}`)
                .send({
                    name: repoName,
                    description: "Bob's version of the awesome web app",
                    visibility: true,
                });
            assert.strictEqual(res.status, 201);
            const repo = res.body.data.repository || res.body.data;
            assert.strictEqual(repo.name, repoName);
            repo2Id = repo._id;
            assert.notStrictEqual(repo1Id, repo2Id);
        });

        it("Compound Index: User 1 cannot create duplicate repo with same name", async () => {
            const res = await request(app)
                .post("/api/repo/create")
                .set("Authorization", `Bearer ${user1Token}`)
                .send({
                    name: repoName,
                    description: "Duplicate repo",
                });
            assert.strictEqual(res.status, 409);
        });

        it("GET /api/repo/owner/:owner/:repoName should fetch repo by owner and name", async () => {
            const res = await request(app)
                .get(`/api/repo/owner/${user1Data.username}/${repoName}`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.data.repository.name, repoName);
        });

        it("POST /api/repo/:id/star should allow User 2 to star User 1's repo", async () => {
            const res = await request(app)
                .post(`/api/repo/${repo1Id}/star`)
                .set("Authorization", `Bearer ${user2Token}`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.data.isStarred, true);
            assert.strictEqual(res.body.data.starsCount, 1);
        });

        it("DELETE /api/repo/:id/star should allow User 2 to unstar User 1's repo", async () => {
            const res = await request(app)
                .delete(`/api/repo/${repo1Id}/star`)
                .set("Authorization", `Bearer ${user2Token}`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.data.isStarred, false);
            assert.strictEqual(res.body.data.starsCount, 0);
        });

        it("POST /api/repo/create with initializeReadme=false should create a genuinely empty repository", async () => {
            const emptyRepoName = `empty-repo-${timestamp}`;
            const res = await request(app)
                .post("/api/repo/create")
                .set("Authorization", `Bearer ${user1Token}`)
                .send({
                    name: emptyRepoName,
                    description: "An empty repository without README",
                    visibility: true,
                    initializeReadme: false,
                });
            assert.strictEqual(res.status, 201);
            const emptyRepo = res.body.data.repository;
            assert.ok(emptyRepo._id);

            // Verify tree is completely empty
            const treeRes = await request(app).get(`/api/repos/${emptyRepo._id}/tree`);
            assert.strictEqual(treeRes.status, 200);
            assert.strictEqual(treeRes.body.data.isEmpty, true);
            assert.strictEqual(treeRes.body.data.tree.length, 0);
            assert.strictEqual(treeRes.body.data.latestCommit, null);

            // Verify commits is completely empty
            const commitsRes = await request(app).get(`/api/repos/${emptyRepo._id}/commits`);
            assert.strictEqual(commitsRes.status, 200);
            assert.strictEqual(commitsRes.body.data.commits.length, 0);

            // Clean up
            await request(app)
                .delete(`/api/repo/delete/${emptyRepo._id}`)
                .set("Authorization", `Bearer ${user1Token}`);
        });

        it("Custom VCS: GET /api/repos/:repoId/tree should fetch repository state directly from S3", async () => {
            const res = await request(app).get(`/api/repos/${repo1Id}/tree`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.data.isEmpty, false);
            assert.ok(res.body.data.tree.some((f) => f.name === "README.md"));
            assert.ok(res.body.data.readme);
            assert.strictEqual(res.body.data.readme.path, "README.md");
        });
    });

    // 4. Git Emulation (Branches, Files, Commits)
    describe("4. Git Emulation (Branches, Commits & Files)", { concurrency: 1 }, () => {
        it("GET /api/repos/:repoId/branches should list main branch", async () => {
            const res = await request(app)
                .get(`/api/repos/${repo1Id}/branches`);
            assert.strictEqual(res.status, 200);
            assert.ok(Array.isArray(res.body.data.branches));
            assert.ok(res.body.data.branches.some((b) => b.name === "main"));
        });

        it("POST /api/repos/:repoId/branches should create a new branch 'feature-auth'", async () => {
            const res = await request(app)
                .post(`/api/repos/${repo1Id}/branches`)
                .set("Authorization", `Bearer ${user1Token}`)
                .send({
                    name: "feature-auth",
                    fromBranch: "main",
                });
            assert.strictEqual(res.status, 201);
            assert.strictEqual(res.body.data.branch.name, "feature-auth");
        });

        it("POST /api/repos/:repoId/files should commit a new file to 'feature-auth'", async () => {
            const fileContent = "function authenticate() { return true; }\nmodule.exports = authenticate;";
            const res = await request(app)
                .post(`/api/repos/${repo1Id}/files`)
                .set("Authorization", `Bearer ${user1Token}`)
                .send({
                    path: "src/auth.js",
                    content: fileContent,
                    message: "feat: add authentication helper",
                    branch: "feature-auth",
                });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.data.file.path, "src/auth.js");
            assert.ok(res.body.data.commit.sha);
        });

        it("GET /api/repos/:repoId/tree should list files on 'feature-auth'", async () => {
            const res = await request(app)
                .get(`/api/repos/${repo1Id}/tree?branch=feature-auth`);
            assert.strictEqual(res.status, 200);
            const paths = res.body.data.tree.map((f) => f.path);
            assert.ok(paths.includes("README.md") || paths.includes("src"));
        });

        it("GET /api/repos/:repoId/blob should return file content", async () => {
            const res = await request(app)
                .get(`/api/repos/${repo1Id}/blob?path=src/auth.js&branch=feature-auth`);
            assert.strictEqual(res.status, 200);
            assert.ok(res.body.data.content.includes("authenticate"));
        });

        it("GET /api/repos/:repoId/commits should list commit history", async () => {
            const res = await request(app)
                .get(`/api/repos/${repo1Id}/commits?branch=feature-auth`);
            assert.strictEqual(res.status, 200);
            assert.ok(res.body.data.commits.length >= 1); // Feat commit on branch
        });
    });

    // 5. Issues & Discussions
    describe("5. Issues & Comments", { concurrency: 1 }, () => {
        it("POST /api/repos/:repoId/issues should create Issue #1 with auto-incremented number", async () => {
            const res = await request(app)
                .post(`/api/repos/${repo1Id}/issues`)
                .set("Authorization", `Bearer ${user2Token}`)
                .send({
                    title: "Bug: Cannot reset password",
                    description: "When submitting reset email, receiving 500 error.",
                    labels: ["bug", "priority-high"],
                });
            assert.strictEqual(res.status, 201);
            const issue = res.body.data.issue;
            assert.strictEqual(issue.issueNumber, 1);
            issue1Id = issue._id;
        });

        it("POST /api/repos/:repoId/issues should create Issue #2 with auto-incremented number 2", async () => {
            const res = await request(app)
                .post(`/api/repos/${repo1Id}/issues`)
                .set("Authorization", `Bearer ${user1Token}`)
                .send({
                    title: "Feature: Add Dark Mode Toggle",
                    description: "Support GitHub dark theme across all subviews.",
                    labels: ["enhancement"],
                });
            assert.strictEqual(res.status, 201);
            const issue = res.body.data.issue;
            assert.strictEqual(issue.issueNumber, 2);
        });

        it("POST /api/repos/:repoId/comments should post comment to Issue #1", async () => {
            const res = await request(app)
                .post(`/api/repos/${repo1Id}/comments`)
                .set("Authorization", `Bearer ${user1Token}`)
                .send({
                    targetType: "Issue",
                    targetId: issue1Id,
                    body: "Investigating the issue. Will push fix shortly.",
                });
            assert.strictEqual(res.status, 201);
            assert.strictEqual(res.body.data.comment.body, "Investigating the issue. Will push fix shortly.");
        });

        it("GET /api/repos/:repoId/comments should return list of comments", async () => {
            const res = await request(app)
                .get(`/api/repos/${repo1Id}/comments?targetType=Issue&targetId=${issue1Id}`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.data.comments.length, 1);
        });

        it("PUT /api/issue/update/:id should allow owner to close the issue", async () => {
            const res = await request(app)
                .put(`/api/issue/update/${issue1Id}`)
                .set("Authorization", `Bearer ${user1Token}`)
                .send({ status: "closed" });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.data.issue.status, "closed");
        });
    });

    // 6. Pull Requests & Merging
    describe("6. Pull Requests & Automated Merging", { concurrency: 1 }, () => {
        it("POST /api/repos/:repoId/pulls should create a PR from feature-auth to main", async () => {
            const res = await request(app)
                .post(`/api/repos/${repo1Id}/pulls`)
                .set("Authorization", `Bearer ${user1Token}`)
                .send({
                    title: "Add Authentication Service",
                    description: "Implements JWT login helpers in src/auth.js",
                    sourceBranch: "feature-auth",
                    targetBranch: "main",
                });
            assert.strictEqual(res.status, 201);
            const pr = res.body.data.pullRequest;
            assert.strictEqual(pr.sourceBranch, "feature-auth");
            assert.strictEqual(pr.targetBranch, "main");
            assert.strictEqual(pr.status, "open");
            pr1Id = pr._id;
        });

        it("GET /api/repos/:repoId/pulls/:id should return PR details with file diffs", async () => {
            const res = await request(app)
                .get(`/api/repos/${repo1Id}/pulls/${pr1Id}`);
            assert.strictEqual(res.status, 200);
            assert.ok(Array.isArray(res.body.data.diff));
            assert.ok(res.body.data.diff.some((f) => f.path === "src/auth.js"));
        });

        it("PUT /api/repos/:repoId/pulls/:id/merge should merge the PR and update main branch", async () => {
            const res = await request(app)
                .put(`/api/repos/${repo1Id}/pulls/${pr1Id}/merge`)
                .set("Authorization", `Bearer ${user1Token}`)
                .send({ commitMessage: "Merge pull request #1 from feature-auth" });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.data.pullRequest.status, "merged");
        });

        it("Main branch should now contain src/auth.js after merge", async () => {
            const res = await request(app)
                .get(`/api/repos/${repo1Id}/tree?branch=main`);
            assert.strictEqual(res.status, 200);
            const paths = res.body.data.tree.map((f) => f.path);
            assert.ok(paths.includes("README.md") || paths.includes("src"));
        });
    });

    // 7. Global Search & Notifications
    describe("7. Global Search & Notifications", { concurrency: 1 }, () => {
        it("GET /api/search should find repository by keyword query", async () => {
            const res = await request(app)
                .get("/api/search?q=awesome");
            assert.strictEqual(res.status, 200);
            assert.ok(res.body.data.repositories.length >= 1);
            assert.ok(res.body.data.repositories.some((r) => r.name.includes("awesome-web-app")));
        });

        it("GET /api/notifications should return notification list for authenticated user", async () => {
            const res = await request(app)
                .get("/api/notifications")
                .set("Authorization", `Bearer ${user1Token}`);
            assert.strictEqual(res.status, 200);
            assert.ok(Array.isArray(res.body.data.notifications));
        });
    });
});
