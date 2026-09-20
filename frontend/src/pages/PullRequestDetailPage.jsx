import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import { useRepo } from "../hooks/useRepo";
import { useAuth } from "../hooks/useAuth";
import prService from "../services/prService";
import commentService from "../services/commentService";
import RepoLayout from "../layouts/RepoLayout";
import { CommentItem, CommentBox } from "../components/issue/CommentBox";
import DiffViewer from "../components/repo/DiffViewer";
import { formatDate } from "../core/utils/dateFormatter";
import {
    GitPullRequestIcon,
    GitMergeIcon,
    GitPullRequestClosedIcon,
    ArrowRightIcon,
    CheckIcon,
} from "@primer/octicons-react";

export const PullRequestDetailPage = () => {
    const { owner, repo: repoName, pullId } = useParams();
    const { repo } = useRepo(owner, repoName);
    const { currentUser } = useAuth();

    const [pr, setPr] = useState(null);
    const [diff, setDiff] = useState([]);
    const [comments, setComments] = useState([]);
    const [activeTab, setActiveTab] = useState("conversation"); // "conversation" | "files"
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [merging, setMerging] = useState(false);
    const [confirmMerge, setConfirmMerge] = useState(false);

    const fetchPR = useCallback(async () => {
        if (!repo?._id || !pullId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await prService.getPullRequest(repo._id, pullId);
            setPr(data.pullRequest);
            setDiff(data.diff || []);
            setComments(data.comments || []);
        } catch (err) {
            setError(err.message || "Failed to load pull request.");
        } finally {
            setLoading(false);
        }
    }, [repo?._id, pullId]);

    useEffect(() => {
        fetchPR();
    }, [fetchPR]);

    const handleAddComment = async (body) => {
        const comment = await commentService.addComment(repo._id, {
            targetType: "PullRequest",
            targetId: pr._id,
            body,
        });
        setComments((prev) => [...prev, comment]);
    };

    const handleEditComment = async (id, newBody) => {
        const updated = await commentService.updateComment(id, newBody);
        setComments((prev) => prev.map((c) => (c._id === id ? updated : c)));
    };

    const handleDeleteComment = async (id) => {
        await commentService.deleteComment(id);
        setComments((prev) => prev.filter((c) => c._id !== id));
    };

    const handleMerge = async () => {
        setMerging(true);
        try {
            const merged = await prService.mergePullRequest(repo._id, pr._id);
            setPr(merged);
            setConfirmMerge(false);
            await fetchPR();
        } catch (err) {
            alert(err.message || "Failed to merge pull request.");
        } finally {
            setMerging(false);
        }
    };

    const handleClosePR = async () => {
        try {
            const closed = await prService.closePullRequest(repo._id, pr._id);
            setPr(closed);
        } catch (err) {
            alert(err.message || "Failed to close pull request.");
        }
    };

    const isOwner = currentUser && (currentUser.id === repo?.owner?._id || currentUser.username === repo?.owner?.username);

    return (
        <RepoLayout>
            {loading ? (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                    Loading pull request...
                </div>
            ) : error || !pr ? (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                    <h3>Pull request not found</h3>
                    <p style={{ color: "var(--color-fg-muted)", margin: "8px 0 16px" }}>{error}</p>
                    <Link to={`/${owner}/${repoName}/pulls`}>Back to pull requests</Link>
                </div>
            ) : (
                <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
                    {/* Header Bar */}
                    <div style={{ borderBottom: "1px solid var(--color-border-default)", paddingBottom: "16px", marginBottom: "20px" }}>
                        <h1 style={{ fontSize: "28px", fontWeight: 400, margin: "0 0 10px" }}>
                            {pr.title} <span style={{ color: "var(--color-fg-muted)", fontWeight: 300 }}>#{pr.number}</span>
                        </h1>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "14px", color: "var(--color-fg-muted)" }}>
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "4px 12px",
                                    borderRadius: "20px",
                                    backgroundColor:
                                        pr.status === "open"
                                            ? "var(--color-success-emphasis)"
                                            : pr.status === "merged"
                                            ? "#8957e5"
                                            : "var(--color-danger-emphasis)",
                                    color: "white",
                                    fontWeight: 600,
                                    fontSize: "13px",
                                }}
                            >
                                {pr.status === "open" ? (
                                    <GitPullRequestIcon size={16} />
                                ) : pr.status === "merged" ? (
                                    <GitMergeIcon size={16} />
                                ) : (
                                    <GitPullRequestClosedIcon size={16} />
                                )}
                                <span style={{ textTransform: "capitalize" }}>{pr.status}</span>
                            </span>

                            <span>
                                <strong>{pr.author?.username || "Unknown"}</strong> wants to merge into{" "}
                                <span style={{ fontFamily: "monospace", backgroundColor: "var(--color-canvas-subtle)", padding: "2px 6px", borderRadius: "4px", color: "var(--color-fg-default)" }}>
                                    {pr.targetBranch}
                                </span>{" "}
                                from{" "}
                                <span style={{ fontFamily: "monospace", backgroundColor: "var(--color-canvas-subtle)", padding: "2px 6px", borderRadius: "4px", color: "var(--color-fg-default)" }}>
                                    {pr.sourceBranch}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* PR Sub-Tabs: Conversation vs. Files Changed */}
                    <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid var(--color-border-default)", marginBottom: "24px" }}>
                        <button
                            onClick={() => setActiveTab("conversation")}
                            style={{
                                padding: "8px 16px",
                                background: "transparent",
                                border: "none",
                                borderBottom: activeTab === "conversation" ? "2px solid #fd8c73" : "2px solid transparent",
                                color: activeTab === "conversation" ? "var(--color-fg-default)" : "var(--color-fg-muted)",
                                fontWeight: activeTab === "conversation" ? 600 : 400,
                                fontSize: "14px",
                            }}
                        >
                            Conversation ({comments.length + 1})
                        </button>

                        <button
                            onClick={() => setActiveTab("files")}
                            style={{
                                padding: "8px 16px",
                                background: "transparent",
                                border: "none",
                                borderBottom: activeTab === "files" ? "2px solid #fd8c73" : "2px solid transparent",
                                color: activeTab === "files" ? "var(--color-fg-default)" : "var(--color-fg-muted)",
                                fontWeight: activeTab === "files" ? 600 : 400,
                                fontSize: "14px",
                            }}
                        >
                            Files changed ({diff.length})
                        </button>
                    </div>

                    {/* Conversation Tab View */}
                    {activeTab === "conversation" && (
                        <div>
                            {/* Original PR Description as First Comment */}
                            <CommentItem
                                comment={{
                                    _id: pr._id,
                                    author: pr.author,
                                    createdAt: pr.createdAt,
                                    body: pr.description || "No description provided.",
                                }}
                                onEdit={() => {}}
                                onDelete={() => {}}
                            />

                            {/* Discussion Comments */}
                            {comments.map((c) => (
                                <CommentItem
                                    key={c._id}
                                    comment={c}
                                    onEdit={handleEditComment}
                                    onDelete={handleDeleteComment}
                                />
                            ))}

                            {/* Merge Box (Only if Open) */}
                            {pr.status === "open" && isOwner && (
                                <div
                                    style={{
                                        border: "1px solid var(--color-border-default)",
                                        borderRadius: "6px",
                                        backgroundColor: "var(--color-canvas-subtle)",
                                        padding: "16px 20px",
                                        marginTop: "24px",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                                        <div
                                            style={{
                                                width: "32px",
                                                height: "32px",
                                                borderRadius: "50%",
                                                backgroundColor: "var(--color-success-emphasis)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "white",
                                            }}
                                        >
                                            <CheckIcon size={18} />
                                        </div>
                                        <div>
                                            <strong style={{ fontSize: "14px", color: "var(--color-fg-default)" }}>
                                                This branch has no conflicts with the base branch
                                            </strong>
                                            <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
                                                Merging will combine the changes from {pr.sourceBranch} into {pr.targetBranch}.
                                            </div>
                                        </div>
                                    </div>

                                    {!confirmMerge ? (
                                        <button
                                            onClick={() => setConfirmMerge(true)}
                                            style={{
                                                padding: "6px 16px",
                                                backgroundColor: "var(--color-success-emphasis)",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "6px",
                                                fontWeight: 600,
                                                fontSize: "13px",
                                            }}
                                        >
                                            Merge pull request
                                        </button>
                                    ) : (
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button
                                                onClick={handleMerge}
                                                disabled={merging}
                                                style={{
                                                    padding: "6px 16px",
                                                    backgroundColor: "var(--color-success-emphasis)",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    fontWeight: 600,
                                                    fontSize: "13px",
                                                }}
                                            >
                                                {merging ? "Merging..." : "Confirm merge"}
                                            </button>
                                            <button
                                                onClick={() => setConfirmMerge(false)}
                                                style={{
                                                    padding: "6px 12px",
                                                    backgroundColor: "transparent",
                                                    border: "1px solid var(--color-border-default)",
                                                    borderRadius: "6px",
                                                    color: "var(--color-fg-default)",
                                                    fontSize: "13px",
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Comment Submission Box */}
                            <CommentBox
                                onAddComment={handleAddComment}
                                onToggleStatus={handleClosePR}
                                status={pr.status}
                                canToggleStatus={pr.status === "open" && isOwner}
                            />
                        </div>
                    )}

                    {/* Files Changed Diff Tab View */}
                    {activeTab === "files" && (
                        <div>
                            <DiffViewer diffs={diff} />
                        </div>
                    )}
                </div>
            )}
        </RepoLayout>
    );
};

export default PullRequestDetailPage;
