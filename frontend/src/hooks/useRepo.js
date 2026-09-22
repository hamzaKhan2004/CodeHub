import { useState, useEffect, useCallback } from "react";
import repoService from "../services/repoService";

// In-memory cache and in-flight request deduplication map
const repoCache = new Map();
const inFlightPromises = new Map();

/**
 * useRepo Hook (Layer 2)
 * Manages repository state, star/unstar actions, and settings mutations.
 * Automatically deduplicates concurrent requests for the same repository across parent/child components.
 */
export const useRepo = (owner, repoName) => {
    const cacheKey = owner && repoName ? `${owner.toLowerCase().trim()}/${repoName.toLowerCase().trim()}` : null;

    const [repo, setRepo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Synchronously reset state whenever repository identity changes
    const [prevCacheKey, setPrevCacheKey] = useState(cacheKey);
    if (cacheKey !== prevCacheKey) {
        setPrevCacheKey(cacheKey);
        setRepo(null);
        setLoading(true);
        setError(null);
    }

    const fetchRepo = useCallback(async (force = false) => {
        if (!owner || !repoName || !cacheKey) {
            setLoading(false);
            return;
        }

        // If a request for this repository is already in-flight, await the same promise
        if (inFlightPromises.has(cacheKey)) {
            try {
                const data = await inFlightPromises.get(cacheKey);
                setRepo(data);
                setError(null);
            } catch (err) {
                setError(err.message || "Failed to load repository.");
                setRepo(null);
            } finally {
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        setError(null);

        const fetchPromise = repoService.getRepoByOwnerAndName(owner, repoName)
            .then((data) => {
                repoCache.set(cacheKey, data);
                inFlightPromises.delete(cacheKey);
                return data;
            })
            .catch((err) => {
                inFlightPromises.delete(cacheKey);
                throw err;
            });

        inFlightPromises.set(cacheKey, fetchPromise);

        try {
            const data = await fetchPromise;
            setRepo(data);
        } catch (err) {
            setError(err.message || "Failed to load repository.");
            setRepo(null);
        } finally {
            setLoading(false);
        }
    }, [owner, repoName, cacheKey]);

    useEffect(() => {
        fetchRepo();
    }, [fetchRepo]);

    const toggleStar = async () => {
        if (!repo) return;
        const previousState = { isStarred: repo.isStarred, starsCount: repo.starsCount };

        // Optimistic UI Update
        const nextStarred = !repo.isStarred;
        const nextCount = nextStarred ? repo.starsCount + 1 : Math.max(0, repo.starsCount - 1);
        const updated = { ...repo, isStarred: nextStarred, starsCount: nextCount };

        setRepo(updated);
        if (cacheKey) repoCache.set(cacheKey, updated);

        try {
            if (nextStarred) {
                await repoService.starRepository(repo._id);
            } else {
                await repoService.unstarRepository(repo._id);
            }
        } catch (err) {
            // Rollback on error
            setRepo((prev) => ({ ...prev, ...previousState }));
            if (cacheKey) repoCache.set(cacheKey, { ...repo, ...previousState });
            throw err;
        }
    };

    const updateRepo = async (updates) => {
        if (!repo) return;
        const updated = await repoService.updateRepository(repo._id, updates);
        const merged = { ...repo, ...updated };
        setRepo(merged);
        if (cacheKey) repoCache.set(cacheKey, merged);
        return merged;
    };

    const deleteRepo = async () => {
        if (!repo) return;
        await repoService.deleteRepository(repo._id);
        if (cacheKey) repoCache.delete(cacheKey);
    };

    return {
        repo,
        loading,
        error,
        refetch: () => fetchRepo(true),
        toggleStar,
        updateRepo,
        deleteRepo,
    };
};

export default useRepo;
