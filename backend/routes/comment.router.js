const express = require("express");
const commentController = require("../controllers/commentController");
const { requireAuth, optionalAuth } = require("../middleware/authMiddleware");
const { validateComment } = require("../middleware/validator");

const commentRouter = express.Router();

commentRouter.get("/repos/:repoId/comments", optionalAuth, commentController.listComments);
commentRouter.post("/repos/:repoId/comments", requireAuth, validateComment, commentController.addComment);
commentRouter.put("/comments/:id", requireAuth, validateComment, commentController.updateComment);
commentRouter.delete("/comments/:id", requireAuth, commentController.deleteComment);

module.exports = commentRouter;
