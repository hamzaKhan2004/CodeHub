const express = require("express");
const repoController = require("../controllers/repoController");
const { requireAuth, optionalAuth } = require("../middleware/authMiddleware");
const { validateRepoCreate } = require("../middleware/validator");

const repoRouter = express.Router();

// Repository Creation & Listing
repoRouter.post("/repo/create", requireAuth, validateRepoCreate, repoController.createRepository);
repoRouter.get("/repo/all", optionalAuth, repoController.getAllRepositories);
repoRouter.get("/repo/:id", optionalAuth, repoController.fetchRepositoryById);
repoRouter.get("/repo/owner/:owner/:repoName", optionalAuth, repoController.fetchRepositoryByOwnerAndName);
repoRouter.get("/repo/name/:name", optionalAuth, repoController.fetchRepositoryByName);
repoRouter.get("/repo/user/:userID", optionalAuth, repoController.fetchRepositoriesForCurrentUser);

// Repository Mutation (Owner Authorization enforced in service)
repoRouter.put("/repo/update/:id", requireAuth, repoController.updateRepositoryById);
repoRouter.patch("/repo/toggle/:id", requireAuth, repoController.toggleVisibilityById);
repoRouter.delete("/repo/delete/:id", requireAuth, repoController.deleteRepositoryById);

// Social (Stars)
repoRouter.post("/repo/:id/star", requireAuth, repoController.starRepository);
repoRouter.delete("/repo/:id/star", requireAuth, repoController.unstarRepository);

module.exports = repoRouter;