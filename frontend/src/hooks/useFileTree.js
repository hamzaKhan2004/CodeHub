import { useState, useEffect, useCallback } from "react";
import codeService from "../services/codeService";

/**
 * useFileTree Hook (Layer 2)
 * Manages repository branch selection, directory tree navigation, and file operations.
 */
export const useFileTree = (repoId, defaultBranch = "main", initialPath = "") => {
    const [branch, setBranch] = useState(defaultBranch);
    const [branches, setBranches] = useState([]);
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [tree, setTree] = useState([]);
    const [readme, setReadme] = useState(null);
    const [latestCommit, setLatestCommit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Synchronously clear stale tree data when repoId, branch, or currentPath changes
    const treeKey = `${repoId || ""}/${branch || defaultBranch}/${currentPath || ""}`;
    const [prevTreeKey, setPrevTreeKey] = useState(treeKey);
    if (treeKey !== prevTreeKey) {
        setPrevTreeKey(treeKey);
        setTree([]);
        setReadme(null);
        setLatestCommit(null);
        setLoading(true);
        setError(null);
    }

    // Sync branch with defaultBranch when loaded
    useEffect(() => {
        if (defaultBranch) {
            setBranch(defaultBranch);
        }
    }, [defaultBranch]);

    // Fetch available branches
    const fetchBranches = useCallback(async () => {
        if (!repoId) return;
        try {
            const data = await codeService.listBranches(repoId);
            setBranches(data);
        } catch (err) {
            console.error("Error fetching branches:", err);
        }
    }, [repoId]);

    // Fetch directory tree and README for current branch and path
    const fetchTree = useCallback(async () => {
        if (!repoId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await codeService.getFileTree(repoId, branch, currentPath);
            setTree(data.tree || []);
            setReadme(data.readme || null);
            setLatestCommit(data.latestCommit || null);
        } catch (err) {
            setError(err.message || "Failed to load directory contents.");
            setTree([]);
            setReadme(null);
        } finally {
            setLoading(false);
        }
    }, [repoId, branch, currentPath]);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    useEffect(() => {
        fetchTree();
    }, [fetchTree]);

    const commitFile = async ({ path, content, message }) => {
        const result = await codeService.commitFile(repoId, {
            branch,
            path,
            content,
            message,
        });
        await fetchTree();
        return result;
    };

    const deleteFile = async ({ path, message }) => {
        const result = await codeService.deleteFile(repoId, {
            branch,
            path,
            message,
        });
        await fetchTree();
        return result;
    };

    const createBranch = async (newBranchName) => {
        const result = await codeService.createBranch(repoId, {
            name: newBranchName,
            sourceBranch: branch,
        });
        await fetchBranches();
        setBranch(newBranchName);
        return result;
    };

    return {
        branch,
        setBranch,
        branches,
        currentPath,
        setCurrentPath,
        tree,
        readme,
        latestCommit,
        loading,
        error,
        refetch: fetchTree,
        commitFile,
        deleteFile,
        createBranch,
    };
};

export default useFileTree;
