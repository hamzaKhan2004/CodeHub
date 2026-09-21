import { useState, useEffect, useCallback } from "react";
import notificationService from "../services/notificationService";
import { useAuth } from "./useAuth";

/**
 * useNotifications Hook (Layer 2)
 */
export const useNotifications = () => {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async (unreadOnly = false) => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const data = await notificationService.getNotifications(unreadOnly);
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (err) {
            console.error("Error fetching unread count:", err);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated, fetchNotifications]);

    const markAsRead = async (id) => {
        await notificationService.markAsRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const markAllAsRead = async () => {
        await notificationService.markAllAsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    return {
        notifications,
        unreadCount,
        loading,
        refetch: fetchNotifications,
        markAsRead,
        markAllAsRead,
    };
};

export default useNotifications;
