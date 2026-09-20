import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../core/constants/apiEndpoints";

/**
 * Repository Service (Layer 3)
 */
export const repoService = {
    async createRepository(data) {
        const res = await apiClient.post(API_ENDPOINTS.REPO_CREATE, data);
        return res.data?.repository || res.data;
    },

    async getAllRepositories(params = {}) {
        const res = await apiClient.get(API_ENDPOINTS.REPOS, { params });
        return res.data;
    },

    async getRepoById(id) {
        const res = await apiClient.get(API_ENDPOINTS.REPO_BY_ID(id));
        return res.data?.repository || res.data;
    },

    async getRepoByOwnerAndName(owner, repo) {
        const res = await apiClient.get(API_ENDPOINTS.REPO_BY_OWNER_NAME(owner, repo));
        return res.data?.repository || res.data;
    },

    async getUserRepositories(userId) {
        const res = await apiClient.get(API_ENDPOINTS.USER_REPOS(userId));
        return res.data?.repositories || res.data;
    },

    async updateRepository(id, data) {
        const res = await apiClient.put(API_ENDPOINTS.REPO_UPDATE(id), data);
        return res.data?.repository || res.data;
    },

    async toggleVisibility(id) {
        const res = await apiClient.patch(API_ENDPOINTS.REPO_TOGGLE(id));
        return res.data?.repository || res.data;
    },

    async deleteRepository(id) {
        const res = await apiClient.delete(API_ENDPOINTS.REPO_DELETE(id));
        return res.data;
    },

    async starRepository(id) {
        const res = await apiClient.post(API_ENDPOINTS.REPO_STAR(id));
        return res.data;
    },

    async unstarRepository(id) {
        const res = await apiClient.delete(API_ENDPOINTS.REPO_STAR(id));
        return res.data;
    },
};

export default repoService;
