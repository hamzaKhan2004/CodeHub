import axios from "axios";
import { tokenStorage } from "../core/utils/tokenStorage";

/**
 * Centralized HTTP Client (Layer 3)
 * Provides automatic token injection, baseURL resolution, and normalized error responses.
 */

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const apiClient = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor: Attach JWT Bearer Token if available
apiClient.interceptors.request.use(
    (config) => {
        const token = tokenStorage.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Normalize Response Data & Envelopes
apiClient.interceptors.response.use(
    (response) => {
        // If the backend returned a standardized envelope { success: true, data: ... }
        if (response.data && typeof response.data === "object" && "success" in response.data) {
            return response.data;
        }
        // Fallback for legacy controllers returning raw data
        return { success: true, data: response.data };
    },
    (error) => {
        const status = error.response ? error.response.status : 500;
        const message =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "An unexpected error occurred.";

        // If 401 Unauthorized occurs on protected routes (excluding login/signup), clear token
        if (status === 401 && !error.config.url.includes("/login") && !error.config.url.includes("/signup")) {
            tokenStorage.clear();
        }

        return Promise.reject({
            status,
            message,
            error: error.response?.data?.error || "ERROR",
            details: error.response?.data?.details || null,
        });
    }
);

export default apiClient;
