import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../core/constants/apiEndpoints";

/**
 * Pull Request Service (Layer 3)
 */
export const prService = {
    async listPullRequests(repoId, params = {}) {
        const res = await apiClient.get(API_ENDPOINTS.PULL_REQUESTS(repoId), { params });
        return res.data;
    },

    async getPullRequest(repoId, identifier) {
        const res = await apiClient.get(API_ENDPOINTS.PULL_REQUEST_DETAIL(repoId, identifier));
        return res.data;
    },

    async createPullRequest(repoId, data) {
        const res = await apiClient.post(API_ENDPOINTS.PULL_REQUESTS(repoId), data);
        return res.data?.pullRequest || res.data;
    },

    async mergePullRequest(repoId, id) {
        const res = await apiClient.put(API_ENDPOINTS.MERGE_PR(repoId, id));
        return res.data?.pullRequest || res.data;
    },

    async closePullRequest(repoId, id) {
        const res = await apiClient.patch(API_ENDPOINTS.CLOSE_PR(repoId, id));
        return res.data?.pullRequest || res.data;
    },
};

export default prService;
