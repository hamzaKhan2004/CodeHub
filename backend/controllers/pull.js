const vcsService = require("../services/vcsService");

const pullRepo = async (remote = "", branch = "main") => {
    try {
        await vcsService.pullLocal(process.cwd(), remote, branch);
        console.log("All commits pulled from S3 ");
    } catch (error) {
        console.log("Unable to pull : ", error.message || error);
    }
};

module.exports = { pullRepo };