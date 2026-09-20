import { useState, useEffect, useCallback } from "react";
import repoService from "../services/repoService";

/**
 * useRepo Hook (Layer 2)
 * Manages repository state, star/unstar actions, and settings mutations.
 */
export const useRepo = (owner, repoName) => {
    const [repo, setRepo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRepo = useCallback(async () => {
        if (!owner || !repoName) return;
        setLoading(true);
        setError(null);
        try {
            const data = await repoService.getRepoByOwnerAndName(owner, repoName);
            setRepo(data);
        } catch (err) {
            setError(err.message || "Failed to load repository.");
            setRepo(null);
        } finally {
            setLoading(false);
        }
    }, [owner, repoName]);

    useEffect(() => {
        fetchRepo();
    }, [fetchRepo]);

    const toggleStar = async () => {
        if (!repo) return;
        const previousState = { isStarred: repo.isStarred, starsCount: repo.starsCount };

        // Optimistic UI Update
        const nextStarred = !repo.isStarred;
        const nextCount = nextStarred ? repo.starsCount + 1 : Math.max(0, repo.starsCount - 1);
        setRepo((prev) => ({ ...prev, isStarred: nextStarred, starsCount: nextCount }));

        try {
            if (nextStarred) {
                await repoService.starRepository(repo._id);
            } else {
                await repoService.unstarRepository(repo._id);
            }
        } catch (err) {
            // Rollback on error
            setRepo((prev) => ({ ...prev, ...previousState }));
            throw err;
        }
    };

    const updateRepo = async (updates) => {
        if (!repo) return;
        const updated = await repoService.updateRepository(repo._id, updates);
        setRepo((prev) => ({ ...prev, ...updated }));
        return updated;
    };

    const deleteRepo = async () => {
        if (!repo) return;
        await repoService.deleteRepository(repo._id);
    };

    return {
        repo,
        loading,
        error,
        refetch: fetchRepo,
        toggleStar,
        updateRepo,
        deleteRepo,
    };
};

export default useRepo;
