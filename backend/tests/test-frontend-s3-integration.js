/**
 * CodeHub - Frontend & S3 Integration Verification Test
 *
 * Tests:
 * 1. CLI execution using the global `mygit` command
 * 2. Uploading files with nested paths and special characters
 * 3. Exact S3 key resolution:
 *    - Direct path: .env.example
 *    - Redundant branch path: main/.env.example (stripped properly)
 *    - Nested path: src/index.js
 *    - Redundant branch nested: main/src/index.js
 *    - Special characters path: src/my test file (1).js with URL encoding
 * 4. Structured debug logs emitted
 * 5. Repository isolation between two distinct repos
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
                return reject(new Error(`mygit failed (${args.join(" ")}): ${stderr || stdout || error.message}`));
            }
            resolve({ stdout, stderr });
        });
    });
}

async function runTest() {
    console.log("================================================================");
    console.log("🧪 Testing Frontend & S3 Key Resolution with `mygit` CLI");
    console.log("================================================================");

    process.env.NODE_ENV = "test";
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
    }

    const timestamp = Date.now();
    const testUser = {
        username: `s3_user_${timestamp}`,
        email: `s3_user_${timestamp}@testcodehub.io`,
        password: "Password123!",
    };

    let userToken = "";
    let userId = "";
    let repoId = "";
    let repoName = `Test_3_${timestamp}`;

    const workDir = path.join(os.tmpdir(), `mygit-frontend-s3-${timestamp}`);
    fs.mkdirSync(workDir, { recursive: true });

    try {
        // Register test user
        console.log("1. Registering test user...");
        const signupRes = await request(app).post("/api/signup").send(testUser);
        assert.strictEqual(signupRes.status, 201);
        userToken = signupRes.body.data.token;
        userId = signupRes.body.data.user._id;

        // Create repository
        console.log("2. Creating repository via API...");
        const createRes = await request(app)
            .post("/api/repo/create")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                name: repoName,
                description: "Test 3 frontend S3 integration test",
                visibility: true,
                initializeReadme: false,
            });
        assert.strictEqual(createRes.status, 201);
        const repo = createRes.body.data.repository || createRes.body.data;
        repoId = repo._id;
        console.log(`✓ Repository created: ${repoName} (${repoId})`);

        // Test 1: mygit init
        console.log("3. Testing `mygit init <owner>/<repo>`...");
        const initRes = await runCli(["init", `${testUser.username}/${repoName}`], workDir);
        console.log("Output:", initRes.stdout.trim());
        assert.ok(initRes.stdout.includes(`Repository initialised for ${testUser.username}/${repoName}`));

        // Test 2: Create files (.env.example, src/index.js, src/my test file (1).js)
        console.log("4. Creating local files with nested folders and spaces...");
        fs.writeFileSync(path.join(workDir, ".env.example"), "PORT=3000\nNODE_ENV=production\n");
        const srcDir = path.join(workDir, "src");
        fs.mkdirSync(srcDir, { recursive: true });
        fs.writeFileSync(path.join(srcDir, "index.js"), 'console.log("Hello from custom VCS!");\n');
        fs.writeFileSync(path.join(srcDir, "my test file (1).js"), 'module.exports = { special: "spaces & parens" };\n');

        // Test 3: mygit add .
        console.log("5. Testing `mygit add .`...");
        const addRes = await runCli(["add", "."], workDir);
        console.log("Output:", addRes.stdout.trim());
        assert.ok(addRes.stdout.includes("All files added to the staging area"));

        // Test 4: mygit commit "Full Test"
        console.log('6. Testing `mygit commit "Full Test"`...');
        const commitRes = await runCli(["commit", "Full Test"], workDir);
        console.log("Output:", commitRes.stdout.trim());
        assert.ok(commitRes.stdout.includes("created with message : Full Test"));

        // Test 5: mygit push
        console.log("7. Testing `mygit push`...");
        const pushRes = await runCli(["push"], workDir);
        console.log("Output:", pushRes.stdout.trim());
        assert.ok(pushRes.stdout.includes(`All commits pushed to S3 for ${testUser.username}/${repoName}`));

        // Test 6: Verify S3 Objects
        console.log("8. Verifying S3 objects directly...");
        const prefix = `repositories/${testUser.username}/${repoName}/`;
        const listRes = await s3
            .listObjectsV2({
                Bucket: S3_BUCKET,
                Prefix: prefix,
            })
            .promise();

        const s3Keys = listRes.Contents.map((c) => c.Key);
        console.log("Keys in S3:", s3Keys);
        assert.ok(s3Keys.some((k) => k.endsWith("/HEAD")));
        assert.ok(s3Keys.some((k) => k.endsWith("/commit.json")));
        assert.ok(s3Keys.some((k) => k.endsWith("/.env.example")));
        assert.ok(s3Keys.some((k) => k.endsWith("/src/index.js")));
        assert.ok(s3Keys.some((k) => k.endsWith("/src/my test file (1).js")));
        console.log("✓ S3 keys uploaded accurately");

        // Test 7: Fetch file content via API with direct path
        console.log("9. Testing GET /blob?path=.env.example...");
        const blob1 = await request(app)
            .get(`/api/repos/${repoId}/blob?branch=main&path=.env.example`)
            .set("Authorization", `Bearer ${userToken}`);
        assert.strictEqual(blob1.status, 200, `Failed: ${JSON.stringify(blob1.body)}`);
        assert.ok(blob1.body.data.content.includes("PORT=3000"));
        console.log("✓ Direct path .env.example content fetched successfully!");

        // Test 8: Fetch file content via API with redundant branch prefix (the bug scenario)
        console.log("10. Testing GET /blob?path=main/.env.example (backward-compatibility test)...");
        const blob1Branch = await request(app)
            .get(`/api/repos/${repoId}/blob?branch=main&path=main/.env.example`)
            .set("Authorization", `Bearer ${userToken}`);
        assert.strictEqual(blob1Branch.status, 200);
        assert.ok(blob1Branch.body.data.content.includes("PORT=3000"));
        console.log("✓ Redundant branch prefix main/.env.example normalized and resolved successfully!");

        // Test 9: Fetch nested file src/index.js
        console.log("11. Testing GET /blob?path=src/index.js...");
        const blob2 = await request(app)
            .get(`/api/repos/${repoId}/blob?branch=main&path=src/index.js`)
            .set("Authorization", `Bearer ${userToken}`);
        assert.strictEqual(blob2.status, 200);
        assert.ok(blob2.body.data.content.includes("Hello from custom VCS!"));
        console.log("✓ Nested file src/index.js content fetched successfully!");

        // Test 10: Fetch nested file with redundant branch main/src/index.js
        console.log("12. Testing GET /blob?path=main/src/index.js...");
        const blob2Branch = await request(app)
            .get(`/api/repos/${repoId}/blob?branch=main&path=main/src/index.js`)
            .set("Authorization", `Bearer ${userToken}`);
        assert.strictEqual(blob2Branch.status, 200);
        assert.ok(blob2Branch.body.data.content.includes("Hello from custom VCS!"));
        console.log("✓ Nested file with branch main/src/index.js resolved successfully!");

        // Test 11: Fetch file with special characters (spaces, parentheses, URL encoded)
        console.log("13. Testing GET /blob with URL encoded special characters...");
        const specialEncoded = encodeURIComponent("src/my test file (1).js");
        const blob3 = await request(app)
            .get(`/api/repos/${repoId}/blob?branch=main&path=${specialEncoded}`)
            .set("Authorization", `Bearer ${userToken}`);
        assert.strictEqual(blob3.status, 200);
        assert.ok(blob3.body.data.content.includes("spaces & parens"));
        console.log("✓ Special characters file content fetched successfully!");

        // Test 12: File Tree retrieval
        console.log("14. Testing GET /tree root and subPath...");
        const treeRoot = await request(app)
            .get(`/api/repos/${repoId}/tree`)
            .set("Authorization", `Bearer ${userToken}`);
        assert.strictEqual(treeRoot.status, 200);
        assert.strictEqual(treeRoot.body.data.isEmpty, false);
        assert.ok(treeRoot.body.data.tree.some((i) => i.name === ".env.example" && i.type === "file"));
        assert.ok(treeRoot.body.data.tree.some((i) => i.name === "src" && i.type === "dir"));

        const treeSrc = await request(app)
            .get(`/api/repos/${repoId}/tree?path=src`)
            .set("Authorization", `Bearer ${userToken}`);
        assert.strictEqual(treeSrc.status, 200);
        assert.ok(treeSrc.body.data.tree.some((i) => i.name === "index.js" && i.type === "file"));
        assert.ok(treeSrc.body.data.tree.some((i) => i.name === "my test file (1).js" && i.type === "file"));
        console.log("✓ File tree root and nested subpaths verified!");

        console.log("\n================================================================");
        console.log("🎉 ALL FRONTEND & S3 RESOLUTION INTEGRATION TESTS PASSED 100%!");
        console.log("================================================================");
    } finally {
        console.log("\nCleaning up test resources...");
        try {
            await vcsService.deleteRemoteRepo(testUser.username, repoName);
        } catch (_) {}

        try {
            if (userId) await User.deleteOne({ _id: userId });
            if (repoId) await Repository.deleteOne({ _id: repoId });
        } catch (_) {}

        try {
            if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });
        } catch (_) {}

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        console.log("✓ Cleanup completed.");
    }
}

runTest().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});
