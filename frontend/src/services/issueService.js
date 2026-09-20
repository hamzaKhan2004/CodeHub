import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../core/constants/apiEndpoints";

/**
 * Issue Service (Layer 3)
 */
export const issueService = {
    async listIssues(repoId, params = {}) {
        const res = await apiClient.get(API_ENDPOINTS.ISSUES(repoId), { params });
        return res.data;
    },

    async getIssue(repoId, identifier) {
        const res = await apiClient.get(API_ENDPOINTS.ISSUE_DETAIL(repoId, identifier));
        return res.data;
    },

    async createIssue(repoId, data) {
        const res = await apiClient.post(API_ENDPOINTS.ISSUES(repoId), data);
        return res.data?.issue || res.data;
    },

    async updateIssue(id, data) {
        const res = await apiClient.put(API_ENDPOINTS.ISSUE_UPDATE(id), data);
        return res.data?.issue || res.data;
    },

    async deleteIssue(id) {
        const res = await apiClient.delete(API_ENDPOINTS.ISSUE_DELETE(id));
        return res.data;
    },
};

export default issueService;
