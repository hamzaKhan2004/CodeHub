import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../core/constants/apiEndpoints";

/**
 * Code, Files, Branches, and Commits Service (Layer 3)
 */
export const codeService = {
    // Branches
    async listBranches(repoId) {
        const res = await apiClient.get(API_ENDPOINTS.BRANCHES(repoId));
        return res.data?.branches || [];
    },

    async createBranch(repoId, { name, sourceBranch }) {
        const res = await apiClient.post(API_ENDPOINTS.BRANCHES(repoId), { name, sourceBranch });
        return res.data?.branch || res.data;
    },

    async setDefaultBranch(repoId, branchName) {
        const res = await apiClient.patch(API_ENDPOINTS.DEFAULT_BRANCH(repoId), { branchName });
        return res.data?.branch || res.data;
    },

    async deleteBranch(repoId, branchName) {
        const res = await apiClient.delete(`${API_ENDPOINTS.BRANCHES(repoId)}/${branchName}`);
        return res.data;
    },

    // File Tree & File Content
    async getFileTree(repoId, branch = "main", path = "") {
        const res = await apiClient.get(API_ENDPOINTS.FILE_TREE(repoId), {
            params: { branch, path },
        });
        return res.data;
    },

    async getFileContent(repoId, branch = "main", path = "") {
        const res = await apiClient.get(API_ENDPOINTS.FILE_CONTENT(repoId), {
            params: { branch, path },
        });
        return res.data;
    },

    async commitFile(repoId, { branch = "main", path, content, message }) {
        const res = await apiClient.post(API_ENDPOINTS.FILE_COMMIT(repoId), {
            branch,
            path,
            content,
            message,
        });
        return res.data;
    },

    async deleteFile(repoId, { branch = "main", path, message }) {
        const res = await apiClient.delete(API_ENDPOINTS.FILE_COMMIT(repoId), {
            data: { branch, path, message },
        });
        return res.data;
    },

    // Commits
    async listCommits(repoId, branch = "main", page = 1, limit = 30) {
        const res = await apiClient.get(API_ENDPOINTS.COMMITS(repoId), {
            params: { branch, page, limit },
        });
        return res.data;
    },

    async getCommitBySha(repoId, sha) {
        const res = await apiClient.get(API_ENDPOINTS.COMMIT_BY_SHA(repoId, sha));
        return res.data?.commit || res.data;
    },
};

export default codeService;
