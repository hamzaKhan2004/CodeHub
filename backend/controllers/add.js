const path = require("path")
const fs = require("fs").promises;

const addRepo = async (filePath) => {
    const repoPath = path.resolve(process.cwd(), ".myGit");
    const stagingPath = path.join(repoPath, "staging");
    try {
        await fs.mkdir(stagingPath, { recursive: true });
        const fileName = path.basename(filePath);
        await fs.copyFile(filePath, path.join(stagingPath, fileName));

        console.log(`File ${fileName} added to the staging`);

    } catch (error) {
        console.log("Error adding file : ", error);
    }


}

module.exports = { addRepo };