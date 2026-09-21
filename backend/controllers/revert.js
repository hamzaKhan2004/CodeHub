const vcsService = require("../services/vcsService");

const revertRepo = async (commitID) => {
    try {
        await vcsService.revertLocal(process.cwd(), commitID);
        console.log(`Commit ${commitID} reverted successfully`);
    } catch (error) {
        console.log("Unable to revert:", error.message || error);
    }
};

module.exports = { revertRepo };
