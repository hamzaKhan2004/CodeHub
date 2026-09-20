const express = require("express");
const userController = require("../controllers/userController");
const { requireAuth, optionalAuth } = require("../middleware/authMiddleware");
const { requireSelf } = require("../middleware/authorizeMiddleware");
const { validateSignup, validateLogin } = require("../middleware/validator");
const { authLimiter } = require("../middleware/rateLimiter");

const userRouter = express.Router();

// Authentication Routes
userRouter.post("/signup", authLimiter, validateSignup, userController.signup);
userRouter.post("/login", authLimiter, validateLogin, userController.login);
userRouter.get("/me", requireAuth, userController.getCurrentUser);

// User Profile Routes (compatible with both legacy and new routes)
userRouter.get("/allUsers", userController.getAllUsers);
userRouter.get("/userProfile/:id", optionalAuth, userController.getUserProfile);
userRouter.get("/users/:id", optionalAuth, userController.getUserProfile);
userRouter.put("/updateProfile/:id", requireAuth, requireSelf("id"), userController.updateUserProfile);
userRouter.delete("/deleteProfile/:id", requireAuth, requireSelf("id"), userController.deleteUserProfile);

// Social & Activity Routes
userRouter.post("/users/:id/follow", requireAuth, userController.followUser);
userRouter.delete("/users/:id/follow", requireAuth, userController.unfollowUser);
userRouter.get("/users/:id/activity", userController.getUserActivity);

module.exports = userRouter;