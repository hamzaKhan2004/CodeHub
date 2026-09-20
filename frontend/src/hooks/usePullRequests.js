import { useState, useEffect, useCallback } from "react";
import prService from "../services/prService";

/**
 * usePullRequests Hook (Layer 2)
 */
export const usePullRequests = (repoId, initialStatus = "open") => {
    const [pullRequests, setPullRequests] = useState([]);
    const [status, setStatus] = useState(initialStatus);
    const [counts, setCounts] = useState({ open: 0, closed: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPRs = useCallback(async () => {
        if (!repoId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await prService.listPullRequests(repoId, { status });
            setPullRequests(data.pullRequests || []);
            setCounts({ open: data.openCount || 0, closed: data.closedCount || 0 });
        } catch (err) {
            setError(err.message || "Failed to load pull requests.");
        } finally {
            setLoading(false);
        }
    }, [repoId, status]);

    useEffect(() => {
        fetchPRs();
    }, [fetchPRs]);

    const createPullRequest = async ({ title, description, sourceBranch, targetBranch }) => {
        const pr = await prService.createPullRequest(repoId, {
            title,
            description,
            sourceBranch,
            targetBranch,
        });
        await fetchPRs();
        return pr;
    };

    return {
        pullRequests,
        status,
        setStatus,
        counts,
        loading,
        error,
        refetch: fetchPRs,
        createPullRequest,
    };
};

export default usePullRequests;
