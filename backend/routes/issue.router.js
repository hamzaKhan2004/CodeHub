const express = require("express");
const issueController = require("../controllers/issueController");
const { requireAuth, optionalAuth } = require("../middleware/authMiddleware");
const { validateIssueCreate } = require("../middleware/validator");

const issueRouter = express.Router();

// Issue Routes (both modern REST and legacy paths supported)
issueRouter.post("/repos/:repoId/issues", requireAuth, validateIssueCreate, issueController.createIssue);
issueRouter.get("/repos/:repoId/issues", optionalAuth, issueController.getAllIssues);
issueRouter.get("/repos/:repoId/issues/:id", optionalAuth, issueController.getIssueById);

// Legacy routes preserved for compatibility
issueRouter.post("/issue/create", requireAuth, validateIssueCreate, issueController.createIssue);
issueRouter.put("/issue/update/:id", requireAuth, issueController.updateIssueById);
issueRouter.delete("/issue/delete/:id", requireAuth, issueController.deleteIssueById);
issueRouter.get("/issue/all", optionalAuth, issueController.getAllIssues);
issueRouter.get("/issue/:id", optionalAuth, issueController.getIssueById);

module.exports = issueRouter;