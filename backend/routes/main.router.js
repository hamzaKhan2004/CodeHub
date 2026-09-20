const express = require("express");
const userRouter = require("./user.router.js");
const repoRouter = require("./repo.router.js");
const codeRouter = require("./code.router.js");
const issueRouter = require("./issue.router.js");
const prRouter = require("./pr.router.js");
const commentRouter = require("./comment.router.js");
const searchRouter = require("./search.router.js");
const notificationRouter = require("./notification.router.js");

const mainRouter = express.Router();

// Mount all feature routers
mainRouter.use(userRouter);
mainRouter.use(repoRouter);
mainRouter.use(codeRouter);
mainRouter.use(issueRouter);
mainRouter.use(prRouter);
mainRouter.use(commentRouter);
mainRouter.use(searchRouter);
mainRouter.use(notificationRouter);

// Health check endpoint
mainRouter.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date() });
});

mainRouter.get("/", (req, res) => {
    res.json({ message: "Welcome to CodeHub API", version: "1.0.0" });
});

module.exports = mainRouter;