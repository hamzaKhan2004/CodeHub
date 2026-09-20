import { useState, useEffect, useCallback } from "react";
import codeService from "../services/codeService";

/**
 * useCommits Hook (Layer 2)
 */
export const useCommits = (repoId, branch = "main", initialPage = 1) => {
    const [commits, setCommits] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(initialPage);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCommits = useCallback(async () => {
        if (!repoId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await codeService.listCommits(repoId, branch, page);
            setCommits(data.commits || []);
            setTotal(data.total || 0);
        } catch (err) {
            setError(err.message || "Failed to load commits.");
        } finally {
            setLoading(false);
        }
    }, [repoId, branch, page]);

    useEffect(() => {
        fetchCommits();
    }, [fetchCommits]);

    return {
        commits,
        total,
        page,
        setPage,
        loading,
        error,
        refetch: fetchCommits,
    };
};

export default useCommits;
