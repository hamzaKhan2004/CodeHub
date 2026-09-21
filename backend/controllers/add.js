const vcsService = require("../services/vcsService");

const addRepo = async (filePath = ".") => {
    try {
        const result = await vcsService.addLocal(process.cwd(), filePath);
        if (result.stagedAll) {
            console.log("All files added to the staging area");
        } else {
            console.log(`File ${result.stagedPath} added to the staging`);
        }
    } catch (error) {
        console.log("Error adding file : ", error.message || error);
    }
};

module.exports = { addRepo };