/**
 * CodeHub Phase 20 - End-to-End Verification Test
 *
 * Validates the complete 15-step scenario:
 * 1. Create empty repository via API (initializeReadme: false)
 * 2. Verify S3 storage has zero commits and no HEAD
 * 3. Verify CodeHub Web API returns isEmpty: true and UI Quick Setup commands
 * 4. Local client init with `mygit init <owner>/<repo>`
 * 5. Create local files (README.md, package.json, src/index.js)
 * 6. Stage files with `mygit add .`
 * 7. Commit with `mygit commit "Initial custom VCS commit"`
 * 8. Push to remote with `mygit push`
 * 9. Directly inspect S3 (HEAD, commit.json, objects in mygitfirstbucket)
 * 10. Verify CodeHub Web API tree (root files, src directory, latestCommit)
 * 11. Verify file content retrieval via Web API blob endpoint
 * 12. Simulate page refreshes (consistent S3 reads)
 * 13. Second commit: edit src/index.js, add src/utils.js, stage, commit, push
 * 14. Verify updated commit in S3 and Web API (2 commits in history)
 * 15. Create repo 2, push to it, verify multi-repo storage isolation in S3
 */

require("dotenv").config();
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFile } = require("child_process");
const request = require("supertest");
const mongoose = require("mongoose");

const { createApp } = require("../index");
const { s3, S3_BUCKET } = require("../config/aws-config");
const vcsService = require("../services/vcsService");
const User = require("../models/userModel");
const Repository = require("../models/repoModel");

const CLI_PATH = path.resolve(__dirname, "../cli.js");
const app = createApp();

function runCli(args, cwd) {
    return new Promise((resolve, reject) => {
        execFile(process.execPath, [CLI_PATH, ...args], { cwd }, (error, stdout, stderr) => {
            if (error) {
                return reject(new Error(`CLI failed (${args.join(" ")}): ${stderr || stdout || error.message}`));
            }
            resolve({ stdout, stderr });
        });
    });
}

async function runPhase20Test() {
    console.log("================================================================");
    console.log("🚀 Starting Phase 20: 15-Step Custom VCS & AWS S3 E2E Verification");
    console.log("================================================================");

    process.env.NODE_ENV = "test";
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
    }

    const timestamp = Date.now();
    const testUser = {
        username: `vcs_owner_${timestamp}`,
        email: `vcs_owner_${timestamp}@testcodehub.io`,
        password: "Password123!",
    };

    let userToken = "";
    let userId = "";
    let repo1Id = "";
    let repo2Id = "";
    let repo1Name = `p20-custom-vcs-${timestamp}`;
    let repo2Name = `p20-isolated-${timestamp}`;
    let repo1Commit1Id = "";
    let repo1Commit2Id = "";

    const workDir1 = path.join(os.tmpdir(), `mygit-p20-repo1-${timestamp}`);
    const workDir2 = path.join(os.tmpdir(), `mygit-p20-repo2-${timestamp}`);

    fs.mkdirSync(workDir1, { recursive: true });
    fs.mkdirSync(workDir2, { recursive: true });

    try {
        // Setup: register user
        console.log("Setup: Registering test user...");
        const signupRes = await request(app).post("/api/signup").send(testUser);
        assert.strictEqual(signupRes.status, 201, `Signup failed: ${JSON.stringify(signupRes.body)}`);
        userToken = signupRes.body.data.token;
        userId = signupRes.body.data.user._id;
        console.log(`✓ User registered: ${testUser.username}`);

        // STEP 1
        console.log("\n[Step 1] Creating empty repo via API (initializeReadme: false)...");
        const createRes = await request(app)
            .post("/api/repo/create")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                name: repo1Name,
                description: "Phase 20 empty custom VCS repository",
                visibility: true,
                initializeReadme: false,
            });
        assert.strictEqual(createRes.status, 201, `Create repo failed: ${JSON.stringify(createRes.body)}`);
        assert.strictEqual(createRes.body.success, true);
        const repo1 = createRes.body.data.repository || createRes.body.data;
        assert.strictEqual(repo1.name, repo1Name);
        repo1Id = repo1._id;
        console.log(`✓ Repository created: ${repo1Name} (ID: ${repo1Id})`);

        // STEP 2
        console.log("\n[Step 2] Verifying S3 storage is completely empty (no commits, no HEAD)...");
        const prefix = `repositories/${testUser.username}/${repo1Name}/`;
        const listRes = await s3
            .listObjectsV2({
                Bucket: S3_BUCKET,
                Prefix: prefix,
            })
            .promise();
        assert.strictEqual(
            listRes.KeyCount,
            0,
            `Expected S3 prefix ${prefix} to be empty, but found ${listRes.KeyCount} objects`
        );
        console.log(`✓ S3 verified: 0 objects exist under ${prefix}`);

        // STEP 3
        console.log("\n[Step 3] Verifying Web API GET /tree returns isEmpty: true for Quick Setup...");
        const treeEmptyRes = await request(app)
            .get(`/api/repos/${repo1Id}/tree`)
            .set("Authorization", `Bearer ${userToken}`);
        assert.strictEqual(treeEmptyRes.status, 200);
        assert.strictEqual(treeEmptyRes.body.success, true);
        assert.strictEqual(treeEmptyRes.body.data.isEmpty, true);
        assert.strictEqual(treeEmptyRes.body.data.tree.length, 0);
        assert.strictEqual(treeEmptyRes.body.data.latestCommit, null);
        console.log("✓ Web API confirms repository is empty; triggers Quick Setup component");

        // STEP 4
        console.log("\n[Step 4] Initializing local client with `mygit init <owner>/<repo>`...");
        const repoIdentifier = `${testUser.username}/${repo1Name}`;
        const { stdout: initOut } = await runCli(["init", repoIdentifier], workDir1);
        console.log("CLI Output:", initOut.trim());
        assert.ok(initOut.includes("Repository initialised"));

        const configPath = path.join(workDir1, ".myGit", "config.json");
        assert.ok(fs.existsSync(configPath), "config.json does not exist");
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        assert.strictEqual(config.owner, testUser.username);
        assert.strictEqual(config.repository, repo1Name);
        console.log(`✓ Local repository initialized with remote ${config.owner}/${config.repository}`);

        // STEP 5
        console.log("\n[Step 5] Creating local files: README.md, package.json, src/index.js...");
        fs.writeFileSync(path.join(workDir1, "README.md"), `# ${repo1Name}\nInitial Phase 20 Custom VCS test.`);
        fs.writeFileSync(
            path.join(workDir1, "package.json"),
            JSON.stringify({ name: repo1Name, version: "1.0.0" }, null, 2)
        );
        fs.mkdirSync(path.join(workDir1, "src"), { recursive: true });
        fs.writeFileSync(path.join(workDir1, "src", "index.js"), 'console.log("Phase 20 Custom VCS v1");\n');
        console.log("✓ Files created locally");

        // STEP 6
        console.log("\n[Step 6] Staging files with `mygit add .`...");
        const { stdout: addOut } = await runCli(["add", "."], workDir1);
        console.log("CLI Output:", addOut.trim());
        assert.ok(fs.existsSync(path.join(workDir1, ".myGit", "staging", "README.md")));
        assert.ok(fs.existsSync(path.join(workDir1, ".myGit", "staging", "package.json")));
        assert.ok(fs.existsSync(path.join(workDir1, ".myGit", "staging", "src", "index.js")));
        console.log("✓ Files and directories staged in .myGit/staging/");

        // STEP 7
        console.log("\n[Step 7] Committing staged files with `mygit commit`...");
        const { stdout: commitOut } = await runCli(["commit", "Initial custom VCS commit"], workDir1);
        console.log("CLI Output:", commitOut.trim());
        const match = commitOut.match(/Commit ([a-f0-9-]+) created/);
        assert.ok(match, "Commit ID not found in CLI output");
        repo1Commit1Id = match[1];

        const commitDir = path.join(workDir1, ".myGit", "commits", repo1Commit1Id);
        assert.ok(fs.existsSync(commitDir));
        assert.ok(fs.existsSync(path.join(commitDir, "commit.json")));
        assert.ok(fs.existsSync(path.join(commitDir, "src", "index.js")));
        console.log(`✓ Commit created locally: ${repo1Commit1Id}`);

        // STEP 8
        console.log("\n[Step 8] Pushing commits to AWS S3 with `mygit push`...");
        const { stdout: pushOut } = await runCli(["push"], workDir1);
        console.log("CLI Output:", pushOut.trim());
        assert.ok(pushOut.includes("All commits pushed to S3"));
        console.log("✓ Pushed to AWS S3 successfully");

        // STEP 9
        console.log("\n[Step 9] Directly inspecting AWS S3 (HEAD, commit.json, objects)...");
        // Verify HEAD
        const headObj = await s3
            .getObject({
                Bucket: S3_BUCKET,
                Key: `repositories/${testUser.username}/${repo1Name}/HEAD`,
            })
            .promise();
        const headCommitId = headObj.Body.toString("utf-8").trim();
        assert.strictEqual(headCommitId, repo1Commit1Id);
        console.log(`✓ S3 HEAD points to commit: ${headCommitId}`);

        // Verify commit.json
        const commitObj = await s3
            .getObject({
                Bucket: S3_BUCKET,
                Key: `repositories/${testUser.username}/${repo1Name}/commits/${repo1Commit1Id}/commit.json`,
            })
            .promise();
        const commitData = JSON.parse(commitObj.Body.toString("utf-8"));
        assert.strictEqual(commitData.commitID, repo1Commit1Id);
        assert.strictEqual(commitData.message, "Initial custom VCS commit");
        console.log(`✓ S3 commit.json verified: "${commitData.message}"`);

        // Verify files in S3
        const readmeObj = await s3
            .getObject({
                Bucket: S3_BUCKET,
                Key: `repositories/${testUser.username}/${repo1Name}/commits/${repo1Commit1Id}/README.md`,
            })
            .promise();
        assert.ok(readmeObj.Body.toString("utf-8").includes("Initial Phase 20 Custom VCS test."));

        const srcObj = await s3
            .getObject({
                Bucket: S3_BUCKET,
                Key: `repositories/${testUser.username}/${repo1Name}/commits/${repo1Commit1Id}/src/index.js`,
            })
            .promise();
        assert.ok(srcObj.Body.toString("utf-8").includes("Phase 20 Custom VCS v1"));
        console.log("✓ File objects verified in S3");

        // STEP 10
        console.log("\n[Step 10] Testing CodeHub Web API GET /tree...");
        const treeRes = await request(app)
            .get(`/api/repos/${repo1Id}/tree`)
            .set("Authorization", `Bearer ${userToken}`);
        assert.strictEqual(treeRes.status, 200);
        assert.strictEqual(treeRes.body.data.isEmpty, false);
        assert.strictEqual(treeRes.body.data.latestCommit.sha, repo1Commit1Id);
        assert.strictEqual(treeRes.body.data.latestCommit.message, "Initial custom VCS commit");

        const tree = treeRes.body.data.tree;
        assert.ok(tree.some((i) => i.name === "README.md" && i.type === "file"));
        assert.ok(tree.some((i) => i.name === "package.json" && i.type === "file"));
        assert.ok(tree.some((i) => i.name === "src" && i.type === "dir"));
        console.log("✓ Root tree contains README.md, package.json, src/ (dir)");

        const subTreeRes = await request(app)
            .get(`/api/repos/${repo1Id}/tree?path=src`)
            .set("Authorization", `Bearer ${userToken}`);
        assert.strictEqual(subTreeRes.status, 200);
        assert.ok(subTreeRes.body.data.tree.some((i) => i.name === "index.js" && i.type === "file"));
        console.log("✓ Subtree for src/ contains index.js");

        // STEP 11
        console.log("\n[Step 11] Testing file content retrieval via GET /blob...");
        const blobRes = await request(app)
            .get(`/api/repos/${repo1Id}/blob?path=src/index.js`)
            .set("Authorization", `Bearer ${userToken}`);
        assert.strictEqual(blobRes.status, 200);
        assert.ok(blobRes.body.data.content.includes("Phase 20 Custom VCS v1"));
        console.log("✓ Blob content retrieved matches accurately");

        // STEP 12
        console.log("\n[Step 12] Simulating page refreshes (consecutive S3 reads)...");
        for (let i = 1; i <= 3; i++) {
            const refreshRes = await request(app)
                .get(`/api/repos/${repo1Id}/tree`)
                .set("Authorization", `Bearer ${userToken}`);
            assert.strictEqual(refreshRes.status, 200);
            assert.strictEqual(refreshRes.body.data.isEmpty, false);
            assert.strictEqual(refreshRes.body.data.latestCommit.sha, repo1Commit1Id);
            assert.strictEqual(refreshRes.body.data.tree.length, 3);
        }
        console.log("✓ 3 consecutive fetches confirmed 100% deterministic persistence from S3");

        // STEP 13
        console.log("\n[Step 13] Modifying src/index.js, adding src/utils.js, stage, commit, push...");
        fs.writeFileSync(path.join(workDir1, "src", "index.js"), 'console.log("Phase 20 Custom VCS v2 - Updated!");\n');
        fs.writeFileSync(path.join(workDir1, "src", "utils.js"), "module.exports = { helper: () => true };\n");

        await runCli(["add", "."], workDir1);
        const { stdout: commit2Out } = await runCli(
            ["commit", "Second commit: update index and add utils"],
            workDir1
        );
        const match2 = commit2Out.match(/Commit ([a-f0-9-]+) created/);
        assert.ok(match2);
        repo1Commit2Id = match2[1];
        console.log(`✓ Second commit created locally: ${repo1Commit2Id}`);

        await runCli(["push"], workDir1);
        console.log("✓ Second commit pushed to S3");

        // STEP 14
        console.log("\n[Step 14] Verifying updated commit in S3 and Web API...");
        const headObj2 = await s3
            .getObject({
                Bucket: S3_BUCKET,
                Key: `repositories/${testUser.username}/${repo1Name}/HEAD`,
            })
            .promise();
        assert.strictEqual(headObj2.Body.toString("utf-8").trim(), repo1Commit2Id);
        console.log(`✓ S3 HEAD updated to: ${repo1Commit2Id}`);

        const commitsRes = await request(app)
            .get(`/api/repos/${repo1Id}/commits`)
            .set("Authorization", `Bearer ${userToken}`);
        assert.strictEqual(commitsRes.status, 200);
        assert.strictEqual(commitsRes.body.data.commits.length, 2);
        assert.strictEqual(commitsRes.body.data.commits[0].sha, repo1Commit2Id);
        assert.strictEqual(commitsRes.body.data.commits[0].message, "Second commit: update index and add utils");
        assert.strictEqual(commitsRes.body.data.commits[1].sha, repo1Commit1Id);
        console.log("✓ Web API commits history returns 2 commits with latest at head");

        const blob2Res = await request(app)
            .get(`/api/repos/${repo1Id}/blob?path=src/index.js`)
            .set("Authorization", `Bearer ${userToken}`);
        assert.strictEqual(blob2Res.status, 200);
        assert.ok(blob2Res.body.data.content.includes("Phase 20 Custom VCS v2 - Updated!"));
        console.log("✓ Web API blob returns updated v2 content");

        const sub2Res = await request(app)
            .get(`/api/repos/${repo1Id}/tree?path=src`)
            .set("Authorization", `Bearer ${userToken}`);
        assert.strictEqual(sub2Res.status, 200);
        assert.ok(sub2Res.body.data.tree.some((i) => i.name === "utils.js" && i.type === "file"));
        assert.ok(sub2Res.body.data.tree.some((i) => i.name === "index.js" && i.type === "file"));
        console.log("✓ Web API tree reflects new utils.js and updated index.js");

        // STEP 15
        console.log("\n[Step 15] Creating repo 2 and verifying strict storage isolation in S3...");
        const create2Res = await request(app)
            .post("/api/repo/create")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                name: repo2Name,
                description: "Phase 20 second isolated repository",
                visibility: true,
                initializeReadme: false,
            });
        assert.strictEqual(create2Res.status, 201);
        const repo2 = create2Res.body.data.repository || create2Res.body.data;
        repo2Id = repo2._id;

        await runCli(["init", `${testUser.username}/${repo2Name}`], workDir2);
        fs.writeFileSync(path.join(workDir2, "isolated-secret.txt"), "This is Repo 2 private content only.\n");
        await runCli(["add", "."], workDir2);
        await runCli(["commit", "Repo 2 initial commit"], workDir2);
        await runCli(["push"], workDir2);
        console.log("✓ Repo 2 initialized, committed, and pushed");

        const repo1Objects = await s3
            .listObjectsV2({
                Bucket: S3_BUCKET,
                Prefix: `repositories/${testUser.username}/${repo1Name}/`,
            })
            .promise();
        const repo2Objects = await s3
            .listObjectsV2({
                Bucket: S3_BUCKET,
                Prefix: `repositories/${testUser.username}/${repo2Name}/`,
            })
            .promise();

        assert.ok(
            !repo1Objects.Contents.some((c) => c.Key.includes("isolated-secret.txt")),
            "Repo 1 S3 storage leaked Repo 2 file!"
        );
        assert.ok(
            repo2Objects.Contents.some((c) => c.Key.includes("isolated-secret.txt")),
            "Repo 2 S3 storage missing isolated-secret.txt"
        );
        assert.ok(
            !repo2Objects.Contents.some((c) => c.Key.includes("utils.js")),
            "Repo 2 S3 storage contains Repo 1 file!"
        );

        const tree1Res = await request(app)
            .get(`/api/repos/${repo1Id}/tree`)
            .set("Authorization", `Bearer ${userToken}`);
        const tree2Res = await request(app)
            .get(`/api/repos/${repo2Id}/tree`)
            .set("Authorization", `Bearer ${userToken}`);

        assert.ok(!tree1Res.body.data.tree.some((i) => i.name === "isolated-secret.txt"));
        assert.ok(tree2Res.body.data.tree.some((i) => i.name === "isolated-secret.txt"));
        console.log("✓ S3 and Web API storage isolation verified between repo 1 and repo 2");

        console.log("\n================================================================");
        console.log("🎉 ALL 15 STEPS OF PHASE 20 COMPLETED AND VERIFIED 100%!");
        console.log("================================================================");
    } finally {
        console.log("\nCleaning up test resources...");
        try {
            await vcsService.deleteRemoteRepo(testUser.username, repo1Name);
            await vcsService.deleteRemoteRepo(testUser.username, repo2Name);
        } catch (_) {}

        try {
            if (userId) {
                await User.deleteOne({ _id: userId });
            }
            if (repo1Id || repo2Id) {
                await Repository.deleteMany({ _id: { $in: [repo1Id, repo2Id].filter(Boolean) } });
            }
        } catch (_) {}

        try {
            if (fs.existsSync(workDir1)) fs.rmSync(workDir1, { recursive: true, force: true });
            if (fs.existsSync(workDir2)) fs.rmSync(workDir2, { recursive: true, force: true });
        } catch (_) {}

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        console.log("✓ Cleanup finished.");
    }
}

runPhase20Test().catch((err) => {
    console.error("\n❌ PHASE 20 TEST FAILED:", err);
    process.exit(1);
});
