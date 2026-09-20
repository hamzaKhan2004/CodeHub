const express = require("express");
const branchController = require("../controllers/branchController");
const fileController = require("../controllers/fileController");
const commitController = require("../controllers/commitController");
const { requireAuth, optionalAuth } = require("../middleware/authMiddleware");
const { validateFileCommit } = require("../middleware/validator");

const codeRouter = express.Router();

// Branch Routes
codeRouter.get("/repos/:repoId/branches", optionalAuth, branchController.listBranches);
codeRouter.post("/repos/:repoId/branches", requireAuth, branchController.createBranch);
codeRouter.patch("/repos/:repoId/branches/default", requireAuth, branchController.setDefaultBranch);
codeRouter.delete("/repos/:repoId/branches/:branchName", requireAuth, branchController.deleteBranch);

// File & Code Browser Routes
codeRouter.get("/repos/:repoId/tree", optionalAuth, fileController.getFileTree);
codeRouter.get("/repos/:repoId/blob", optionalAuth, fileController.getFileContent);
codeRouter.post("/repos/:repoId/files", requireAuth, validateFileCommit, fileController.commitFile);
codeRouter.delete("/repos/:repoId/files", requireAuth, fileController.deleteFile);

// Commit Routes
codeRouter.get("/repos/:repoId/commits", optionalAuth, commitController.listCommits);
codeRouter.get("/repos/:repoId/commits/:sha", optionalAuth, commitController.getCommitBySha);

module.exports = codeRouter;
