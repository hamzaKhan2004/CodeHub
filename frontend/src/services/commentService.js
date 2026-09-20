import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../core/constants/apiEndpoints";

/**
 * Comment Service (Layer 3)
 */
export const commentService = {
    async addComment(repoId, data) {
        const res = await apiClient.post(API_ENDPOINTS.COMMENTS(repoId), data);
        return res.data?.comment || res.data;
    },

    async updateComment(id, body) {
        const res = await apiClient.put(API_ENDPOINTS.COMMENT_MUTATE(id), { body });
        return res.data?.comment || res.data;
    },

    async deleteComment(id) {
        const res = await apiClient.delete(API_ENDPOINTS.COMMENT_MUTATE(id));
        return res.data;
    },
};

export default commentService;
