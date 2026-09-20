import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import { useRepo } from "../hooks/useRepo";
import { useAuth } from "../hooks/useAuth";
import issueService from "../services/issueService";
import commentService from "../services/commentService";
import RepoLayout from "../layouts/RepoLayout";
import { CommentItem, CommentBox } from "../components/issue/CommentBox";
import { formatDate } from "../core/utils/dateFormatter";
import { IssueOpenedIcon, IssueClosedIcon } from "@primer/octicons-react";

export const IssueDetailPage = () => {
    const { owner, repo: repoName, issueId } = useParams();
    const { repo } = useRepo(owner, repoName);
    const { currentUser } = useAuth();

    const [issue, setIssue] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchIssue = useCallback(async () => {
        if (!repo?._id || !issueId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await issueService.getIssue(repo._id, issueId);
            setIssue(data.issue);
            setComments(data.comments || []);
        } catch (err) {
            setError(err.message || "Failed to load issue.");
        } finally {
            setLoading(false);
        }
    }, [repo?._id, issueId]);

    useEffect(() => {
        fetchIssue();
    }, [fetchIssue]);

    const handleAddComment = async (body) => {
        const comment = await commentService.addComment(repo._id, {
            targetType: "Issue",
            targetId: issue._id,
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

    const handleToggleStatus = async () => {
        const nextStatus = issue.status === "open" ? "closed" : "open";
        const updated = await issueService.updateIssue(issue._id, { status: nextStatus });
        setIssue(updated);
    };

    const isAuthor = currentUser && (currentUser.id === issue?.author?._id || currentUser.username === issue?.author?.username);
    const isRepoOwner = currentUser && (currentUser.id === repo?.owner?._id || currentUser.username === repo?.owner?.username);
    const canToggleStatus = isAuthor || isRepoOwner;

    return (
        <RepoLayout>
            {loading ? (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                    Loading issue...
                </div>
            ) : error || !issue ? (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                    <h3>Issue not found</h3>
                    <p style={{ color: "var(--color-fg-muted)", margin: "8px 0 16px" }}>{error}</p>
                    <Link to={`/${owner}/${repoName}/issues`}>Back to issues</Link>
                </div>
            ) : (
                <div style={{ maxWidth: "980px", margin: "0 auto" }}>
                    {/* Issue Header Bar */}
                    <div style={{ borderBottom: "1px solid var(--color-border-default)", paddingBottom: "16px", marginBottom: "24px" }}>
                        <h1 style={{ fontSize: "28px", fontWeight: 400, margin: "0 0 10px", wordBreak: "break-word" }}>
                            {issue.title} <span style={{ color: "var(--color-fg-muted)", fontWeight: 300 }}>#{issue.issueNumber}</span>
                        </h1>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", fontSize: "14px", color: "var(--color-fg-muted)" }}>
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "4px 12px",
                                    borderRadius: "20px",
                                    backgroundColor: issue.status === "open" ? "var(--color-success-emphasis)" : "#8957e5",
                                    color: "white",
                                    fontWeight: 600,
                                    fontSize: "13px",
                                }}
                            >
                                {issue.status === "open" ? <IssueOpenedIcon size={16} /> : <IssueClosedIcon size={16} />}
                                <span>{issue.status === "open" ? "Open" : "Closed"}</span>
                            </span>

                            <span>
                                <strong>{issue.author?.username || "Unknown"}</strong> opened this issue{" "}
                                {formatDate(issue.createdAt)} • {comments.length + 1} comments
                            </span>
                        </div>
                    </div>

                    {/* Original Issue Description as first comment */}
                    <CommentItem
                        comment={{
                            _id: issue._id,
                            author: issue.author,
                            createdAt: issue.createdAt,
                            body: issue.description || "No description provided.",
                        }}
                        onEdit={async (_, newBody) => {
                            const updated = await issueService.updateIssue(issue._id, { description: newBody });
                            setIssue(updated);
                        }}
                        onDelete={() => {}}
                    />

                    {/* Discussion Comments List */}
                    {comments.map((c) => (
                        <CommentItem
                            key={c._id}
                            comment={c}
                            onEdit={handleEditComment}
                            onDelete={handleDeleteComment}
                        />
                    ))}

                    {/* Add Comment & Close/Reopen Box */}
                    <CommentBox
                        onAddComment={handleAddComment}
                        onToggleStatus={handleToggleStatus}
                        status={issue.status}
                        canToggleStatus={canToggleStatus}
                    />
                </div>
            )}
        </RepoLayout>
    );
};

export default IssueDetailPage;
