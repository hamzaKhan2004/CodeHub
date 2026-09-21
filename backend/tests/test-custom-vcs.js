const path = require("path");
const fs = require("fs");
const os = require("os");
const assert = require("assert");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const vcsService = require("../services/vcsService");

async function runTest() {
    console.log("=== Testing Custom VCS & AWS S3 Integration ===");

    const timestamp = Date.now();
    const testOwner = `testowner_${timestamp}`;
    const testRepo = `testrepo_${timestamp}`;
    const workDir = path.join(os.tmpdir(), `mygit-client-${timestamp}`);

    fs.mkdirSync(workDir, { recursive: true });

    try {
        // 1. Test initLocal with repository identifier
        console.log("1. Testing initLocal...");
        const { config } = await vcsService.initLocal(workDir, `${testOwner}/${testRepo}`);
        assert.strictEqual(config.owner, testOwner);
        assert.strictEqual(config.repository, testRepo);
        assert.ok(fs.existsSync(path.join(workDir, ".myGit", "config.json")));
        assert.ok(fs.existsSync(path.join(workDir, ".myGit", "staging")));
        assert.ok(fs.existsSync(path.join(workDir, ".myGit", "commits")));
        console.log("✓ Local repository initialized successfully");

        // 2. Create sample files
        fs.writeFileSync(path.join(workDir, "README.md"), `# ${testRepo}\nSample README content.\n`);
        fs.writeFileSync(path.join(workDir, "package.json"), '{\n  "name": "custom-vcs-app"\n}\n');
        const srcDir = path.join(workDir, "src");
        fs.mkdirSync(srcDir, { recursive: true });
        fs.writeFileSync(path.join(srcDir, "index.js"), 'console.log("Hello from custom VCS!");\n');

        // 3. Test addLocal
        console.log("2. Testing addLocal (stage all)...");
        await vcsService.addLocal(workDir, ".");
        assert.ok(fs.existsSync(path.join(workDir, ".myGit", "staging", "README.md")));
        assert.ok(fs.existsSync(path.join(workDir, ".myGit", "staging", "package.json")));
        assert.ok(fs.existsSync(path.join(workDir, ".myGit", "staging", "src", "index.js")));
        console.log("✓ All files and subdirectories staged properly");

        // 4. Test commitLocal
        console.log("3. Testing commitLocal...");
        const commitRes = await vcsService.commitLocal(workDir, "Initial commit from mygit");
        assert.ok(commitRes.commitID);
        const commitDir = path.join(workDir, ".myGit", "commits", commitRes.commitID);
        assert.ok(fs.existsSync(commitDir));
        assert.ok(fs.existsSync(path.join(commitDir, "commit.json")));
        assert.ok(fs.existsSync(path.join(commitDir, "README.md")));
        assert.ok(fs.existsSync(path.join(commitDir, "src", "index.js")));
        console.log("✓ Commit created locally:", commitRes.commitID);

        // 5. Test pushLocal to real AWS S3!
        console.log("4. Testing pushLocal to AWS S3...");
        const pushRes = await vcsService.pushLocal(workDir);
        console.log(`✓ Pushed ${pushRes.filesUploaded} files across ${pushRes.commitsCount} commit(s) to S3!`);
        assert.strictEqual(pushRes.headCommitId, commitRes.commitID);

        // 6. Test Remote S3 getRemoteTree (API method used by Frontend)
        console.log("5. Testing getRemoteTree from S3 (Frontend API simulation)...");
        const treeRes = await vcsService.getRemoteTree(testOwner, testRepo, "main");
        assert.strictEqual(treeRes.isEmpty, false);
        assert.ok(treeRes.latestCommit);
        assert.strictEqual(treeRes.latestCommit.message, "Initial commit from mygit");
        assert.ok(treeRes.readme);
        assert.strictEqual(treeRes.readme.path, "README.md");
        assert.ok(treeRes.tree.some((item) => item.name === "README.md" && item.type === "file"));
        assert.ok(treeRes.tree.some((item) => item.name === "package.json" && item.type === "file"));
        assert.ok(treeRes.tree.some((item) => item.name === "src" && item.type === "dir"));
        console.log("✓ S3 Tree matches pushed state: README.md, package.json, src/ (dir)");

        // Test subPath inside src
        const subTreeRes = await vcsService.getRemoteTree(testOwner, testRepo, "main", "src");
        assert.ok(subTreeRes.tree.some((item) => item.name === "index.js" && item.type === "file"));
        console.log("✓ S3 Subtree for src/ contains index.js");

        // 7. Test getRemoteBlob
        console.log("6. Testing getRemoteBlob from S3...");
        const blobRes = await vcsService.getRemoteBlob(testOwner, testRepo, "main", "src/index.js");
        assert.ok(blobRes.content.includes("Hello from custom VCS!"));
        console.log("✓ S3 Blob fetched content matches exactly");

        // 8. Test getRemoteCommits
        console.log("7. Testing getRemoteCommits from S3...");
        const commitsRes = await vcsService.getRemoteCommits(testOwner, testRepo, "main");
        assert.strictEqual(commitsRes.commits.length, 1);
        assert.strictEqual(commitsRes.commits[0].sha, commitRes.commitID);
        console.log("✓ S3 Commits history verified");

        // 9. Test Web Initialized Repo (initializeReadme: true vs false)
        console.log("8. Testing Web Repository Creation (with vs without README)...");
        const emptyRepoName = `emptyrepo_${timestamp}`;
        const emptyRes = await vcsService.createRemoteRepo(testOwner, emptyRepoName, { initializeReadme: false });
        assert.strictEqual(emptyRes.isEmpty, true);
        const emptyTreeRes = await vcsService.getRemoteTree(testOwner, emptyRepoName, "main");
        assert.strictEqual(emptyTreeRes.isEmpty, true);
        assert.strictEqual(emptyTreeRes.tree.length, 0);
        console.log("✓ initializeReadme: false leaves S3 genuinely empty (Quick Setup trigger)");

        const readmeRepoName = `readmerepo_${timestamp}`;
        const readmeCreateRes = await vcsService.createRemoteRepo(testOwner, readmeRepoName, {
            initializeReadme: true,
            description: "A test description",
        });
        assert.strictEqual(readmeCreateRes.isEmpty, false);
        const readmeTreeRes = await vcsService.getRemoteTree(testOwner, readmeRepoName, "main");
        assert.strictEqual(readmeTreeRes.isEmpty, false);
        assert.strictEqual(readmeTreeRes.readme.path, "README.md");
        console.log("✓ initializeReadme: true creates initial commit in S3 with README.md");

        // Clean up S3
        console.log("9. Cleaning up test S3 repositories...");
        await vcsService.deleteRemoteRepo(testOwner, testRepo);
        await vcsService.deleteRemoteRepo(testOwner, emptyRepoName);
        await vcsService.deleteRemoteRepo(testOwner, readmeRepoName);
        console.log("✓ S3 cleaned up successfully");

        console.log("==================================================");
        console.log("✓✓✓ ALL CUSTOM VCS & S3 TESTS PASSED 100%! ✓✓✓");
        console.log("==================================================");
    } finally {
        if (fs.existsSync(workDir)) {
            fs.rmSync(workDir, { recursive: true, force: true });
        }
    }
}

runTest().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});
