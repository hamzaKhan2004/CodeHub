import { useState, useEffect, useCallback } from "react";
import issueService from "../services/issueService";

/**
 * useIssues Hook (Layer 2)
 * Manages repository issues, status filters, search, and creation.
 */
export const useIssues = (repoId, initialStatus = "open") => {
    const [issues, setIssues] = useState([]);
    const [status, setStatus] = useState(initialStatus);
    const [search, setSearch] = useState("");
    const [counts, setCounts] = useState({ open: 0, closed: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchIssues = useCallback(async () => {
        if (!repoId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await issueService.listIssues(repoId, { status, search });
            setIssues(data.issues || []);
            setCounts({ open: data.openCount || 0, closed: data.closedCount || 0 });
        } catch (err) {
            setError(err.message || "Failed to load issues.");
        } finally {
            setLoading(false);
        }
    }, [repoId, status, search]);

    useEffect(() => {
        fetchIssues();
    }, [fetchIssues]);

    const createIssue = async ({ title, description, labels, assignees }) => {
        const issue = await issueService.createIssue(repoId, { title, description, labels, assignees });
        await fetchIssues();
        return issue;
    };

    return {
        issues,
        status,
        setStatus,
        search,
        setSearch,
        counts,
        loading,
        error,
        refetch: fetchIssues,
        createIssue,
    };
};

export default useIssues;
