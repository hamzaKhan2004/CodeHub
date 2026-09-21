const vcsService = require("../services/vcsService");

const pushRepo = async (remote = "", branch = "main") => {
    try {
        const result = await vcsService.pushLocal(process.cwd(), remote, branch);
        console.log(`All commits pushed to S3 for ${result.owner ? result.owner + "/" : ""}${result.repoName}.`);
    } catch (error) {
        console.log("Error pushing to S3 : ", error.message || error);
    }
};

module.exports = { pushRepo };