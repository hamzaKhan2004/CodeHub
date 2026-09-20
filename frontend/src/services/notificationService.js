import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../core/constants/apiEndpoints";

/**
 * Notification Service (Layer 3)
 */
export const notificationService = {
    async getNotifications(unreadOnly = false, page = 1) {
        const res = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS, {
            params: { unread: unreadOnly, page },
        });
        return res.data;
    },

    async getUnreadCount() {
        const res = await apiClient.get(API_ENDPOINTS.UNREAD_NOTIFICATIONS_COUNT);
        return res.data?.unreadCount || 0;
    },

    async markAsRead(id) {
        const res = await apiClient.patch(API_ENDPOINTS.MARK_NOTIFICATION_READ(id));
        return res.data;
    },

    async markAllAsRead() {
        const res = await apiClient.patch(API_ENDPOINTS.MARK_ALL_NOTIFICATIONS_READ);
        return res.data;
    },
};

export default notificationService;
