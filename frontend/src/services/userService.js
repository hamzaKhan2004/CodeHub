import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../core/constants/apiEndpoints";

/**
 * User Service (Layer 3)
 */
export const userService = {
    async getUserProfile(idOrUsername) {
        const endpoint = idOrUsername.match(/^[0-9a-fA-F]{24}$/)
            ? API_ENDPOINTS.USER_PROFILE(idOrUsername)
            : API_ENDPOINTS.USER_BY_NAME(idOrUsername);
        const res = await apiClient.get(endpoint);
        return res.data;
    },

    async updateProfile(userId, data) {
        const res = await apiClient.put(`/updateProfile/${userId}`, data);
        return res.data?.user || res.data;
    },

    async followUser(userId) {
        const res = await apiClient.post(API_ENDPOINTS.FOLLOW_USER(userId));
        return res.data;
    },

    async unfollowUser(userId) {
        const res = await apiClient.delete(API_ENDPOINTS.FOLLOW_USER(userId));
        return res.data;
    },

    async getUserActivity(userId) {
        const res = await apiClient.get(API_ENDPOINTS.USER_ACTIVITY(userId));
        return res.data;
    },
};

export default userService;
