const fs = require("fs").promises;
const path = require("path");

const revertRepo = async (commitID) => {
    const repoPath = path.resolve(process.cwd(), ".myGit");
    const commitsPath = path.join(repoPath, "commits");

    try {
        const commitDir = path.join(commitsPath, commitID);
        const files = await fs.readdir(commitDir);

        const parentDir = path.resolve(repoPath, "..");

        for (const file of files) {
            await fs.copyFile(
                path.join(commitDir, file),
                path.join(parentDir, file)
            );
        }

        console.log(`Commit ${commitID} reverted successfully`);
    } catch (error) {
        console.log("Unable to revert:", error);
    }
};

module.exports = { revertRepo };
