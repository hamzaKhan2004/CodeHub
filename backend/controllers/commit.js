const vcsService = require("../services/vcsService");

const commitRepo = async (message) => {
    try {
        const { commitID } = await vcsService.commitLocal(process.cwd(), message);
        console.log(`Commit ${commitID} created with message : ${message}`);
    } catch (error) {
        console.log("Error commiting file : ", error.message || error);
    }
};

module.exports = { commitRepo };