const express = require("express");
const prController = require("../controllers/prController");
const { requireAuth, optionalAuth } = require("../middleware/authMiddleware");
const { validatePullRequest } = require("../middleware/validator");

const prRouter = express.Router();

prRouter.post("/repos/:repoId/pulls", requireAuth, validatePullRequest, prController.createPullRequest);
prRouter.get("/repos/:repoId/pulls", optionalAuth, prController.listPullRequests);
prRouter.get("/repos/:repoId/pulls/:identifier", optionalAuth, prController.getPullRequest);
prRouter.put("/repos/:repoId/pulls/:id/merge", requireAuth, prController.mergePullRequest);
prRouter.patch("/repos/:repoId/pulls/:id/close", requireAuth, prController.closePullRequest);

module.exports = prRouter;
