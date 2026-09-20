const express = require("express");
const notificationController = require("../controllers/notificationController");
const { requireAuth } = require("../middleware/authMiddleware");

const notificationRouter = express.Router();

notificationRouter.get("/notifications", requireAuth, notificationController.getNotifications);
notificationRouter.get("/notifications/unread-count", requireAuth, notificationController.getUnreadCount);
notificationRouter.patch("/notifications/:id/read", requireAuth, notificationController.markNotificationRead);
notificationRouter.patch("/notifications/read-all", requireAuth, notificationController.markAllNotificationsRead);

module.exports = notificationRouter;
