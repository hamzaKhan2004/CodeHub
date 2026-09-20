const Notification = require("../models/notificationModel");
const AppError = require("../utils/appError");

/**
 * Notification Service
 * Manages user notifications, read states, and badge counters.
 */
class NotificationService {
    async getUserNotifications(userId, { unreadOnly = false, page = 1, limit = 30 } = {}) {
        const query = { recipient: userId };
        if (unreadOnly) {
            query.read = false;
        }

        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("sender", "username name avatarUrl")
                .populate("repository", "name owner")
                .populate("issue", "issueNumber title")
                .populate("pullRequest", "number title"),
            Notification.countDocuments(query),
            Notification.countDocuments({ recipient: userId, read: false }),
        ]);

        return {
            notifications,
            total,
            unreadCount,
            page,
            limit,
        };
    }

    async markAsRead(notificationId, userId) {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId },
            { read: true },
            { new: true }
        );

        if (!notification) {
            throw new AppError("Notification not found.", 404, "NOT_FOUND");
        }

        return notification;
    }

    async markAllAsRead(userId) {
        await Notification.updateMany({ recipient: userId, read: false }, { read: true });
        return { message: "All notifications marked as read." };
    }

    async getUnreadCount(userId) {
        const count = await Notification.countDocuments({ recipient: userId, read: false });
        return { unreadCount: count };
    }
}

module.exports = new NotificationService();
