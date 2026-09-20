const notificationService = require("../services/notificationService");
const { successResponse } = require("../utils/apiResponse");

const getNotifications = async (req, res, next) => {
    try {
        const unreadOnly = req.query.unread === "true";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;

        const result = await notificationService.getUserNotifications(req.user._id, {
            unreadOnly,
            page,
            limit,
        });

        return successResponse(res, 200, "Notifications retrieved.", result);
    } catch (err) {
        next(err);
    }
};

const markNotificationRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notification = await notificationService.markAsRead(id, req.user._id);
        return successResponse(res, 200, "Notification marked as read.", { notification });
    } catch (err) {
        next(err);
    }
};

const markAllNotificationsRead = async (req, res, next) => {
    try {
        const result = await notificationService.markAllAsRead(req.user._id);
        return successResponse(res, 200, result.message, null);
    } catch (err) {
        next(err);
    }
};

const getUnreadCount = async (req, res, next) => {
    try {
        const result = await notificationService.getUnreadCount(req.user._id);
        return successResponse(res, 200, "Unread count retrieved.", result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadCount,
};
