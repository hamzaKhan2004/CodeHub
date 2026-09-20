import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../core/constants/apiEndpoints";
import { tokenStorage } from "../core/utils/tokenStorage";

/**
 * Authentication Service (Layer 3)
 */
export const authService = {
    async login({ email, password }) {
        const res = await apiClient.post(API_ENDPOINTS.LOGIN, { email, password });
        if (res.data?.token) {
            tokenStorage.setToken(res.data.token);
            tokenStorage.setUser(res.data.user);
        }
        return res.data;
    },

    async signup({ username, email, password, name }) {
        const res = await apiClient.post(API_ENDPOINTS.SIGNUP, { username, email, password, name });
        if (res.data?.token) {
            tokenStorage.setToken(res.data.token);
            tokenStorage.setUser(res.data.user);
        }
        return res.data;
    },

    async getCurrentUser() {
        const res = await apiClient.get(API_ENDPOINTS.ME);
        const user = res.data?.user || res.data;
        if (user) {
            tokenStorage.setUser(user);
        }
        return user;
    },

    logout() {
        tokenStorage.clear();
    },
};

export default authService;
