import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../core/constants/apiEndpoints";

/**
 * Global Search Service (Layer 3)
 */
export const searchService = {
    async search(query, type = "all", page = 1) {
        const res = await apiClient.get(API_ENDPOINTS.SEARCH, {
            params: { q: query, type, page },
        });
        return res.data;
    },
};

export default searchService;
