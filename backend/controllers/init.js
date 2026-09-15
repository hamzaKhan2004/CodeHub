const path = require("path")
const fs = require("fs").promises;

const initRepo = async () => {
    const repoPath = path.resolve(process.cwd(), ".myGit");
    const commitsPath = path.join(repoPath, "commits");

    try {
        await fs.mkdir(repoPath, { recursive: true });
        await fs.mkdir(commitsPath, { recursive: true });
        await fs.writeFile(
            path.join(repoPath, "config.json"),
            JSON.stringify({ bucket: "S3 bucket" })
        );
        console.log("Repository initialised");


    } catch (error) {
        console.log("Error initialising repository", error);
    }



}

module.exports = { initRepo };