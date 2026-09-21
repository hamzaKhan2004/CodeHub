const vcsService = require("../services/vcsService");

const initRepo = async (repoIdentifier = "") => {
    try {
        const { config } = await vcsService.initLocal(process.cwd(), repoIdentifier);
        if (config.repository) {
            console.log(`Repository initialised for ${config.owner ? config.owner + "/" : ""}${config.repository}`);
        } else {
            console.log("Repository initialised");
        }
    } catch (error) {
        console.log("Error initialising repository", error);
    }
};

module.exports = { initRepo };