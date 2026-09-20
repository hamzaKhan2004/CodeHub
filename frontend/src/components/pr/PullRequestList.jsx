import { Link } from "react-router";
import { formatDate } from "../../core/utils/dateFormatter";
import {
    GitPullRequestIcon,
    GitMergeIcon,
    GitPullRequestClosedIcon,
    CommentIcon,
    ArrowRightIcon,
} from "@primer/octicons-react";

export const PullRequestList = ({
    owner,
    repoName,
    pullRequests = [],
    status = "open",
    setStatus,
    counts = { open: 0, closed: 0 },
    loading = false,
}) => {
    const basePath = `/${owner}/${repoName}`;

    return (
        <div>
            {/* Top Bar with New PR button */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "16px",
                }}
            >
                <div style={{ fontSize: "14px", color: "var(--color-fg-muted)" }}>
                    Compare branches and manage code reviews.
                </div>

                <Link
                    to={`${basePath}/pulls/new`}
                    style={{
                        padding: "6px 14px",
                        backgroundColor: "var(--color-success-emphasis)",
                        color: "white",
                        borderRadius: "6px",
                        fontWeight: 600,
                        fontSize: "13px",
                        textDecoration: "none",
                    }}
                >
                    New pull request
                </Link>
            </div>

            {/* Pull Requests Table */}
            <div
                style={{
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "6px",
                    overflow: "hidden",
                    backgroundColor: "var(--color-canvas-default)",
                }}
            >
                {/* Status Tabs Header */}
                <div
                    style={{
                        backgroundColor: "var(--color-canvas-subtle)",
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--color-border-default)",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        fontSize: "14px",
                    }}
                >
                    <button
                        onClick={() => setStatus("open")}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "transparent",
                            border: "none",
                            color: status === "open" ? "var(--color-fg-default)" : "var(--color-fg-muted)",
                            fontWeight: status === "open" ? 600 : 400,
                            padding: 0,
                        }}
                    >
                        <GitPullRequestIcon size={16} fill={status === "open" ? "var(--color-success-fg)" : "currentColor"} />
                        <span>{counts.open} Open</span>
                    </button>

                    <button
                        onClick={() => setStatus("closed")}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "transparent",
                            border: "none",
                            color: status === "closed" ? "var(--color-fg-default)" : "var(--color-fg-muted)",
                            fontWeight: status === "closed" ? 600 : 400,
                            padding: 0,
                        }}
                    >
                        <GitMergeIcon size={16} fill={status === "closed" ? "#8957e5" : "currentColor"} />
                        <span>{counts.closed} Closed / Merged</span>
                    </button>
                </div>

                {/* PR Items */}
                {loading ? (
                    <div style={{ padding: "32px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                        Loading pull requests...
                    </div>
                ) : pullRequests.length === 0 ? (
                    <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                        <GitPullRequestIcon size={32} style={{ marginBottom: "12px", opacity: 0.6 }} />
                        <h3>No {status} pull requests</h3>
                        <p style={{ fontSize: "13px", marginTop: "4px" }}>
                            There are no pull requests matching this state.
                        </p>
                    </div>
                ) : (
                    pullRequests.map((pr) => {
                        const isOpen = pr.status === "open";
                        const isMerged = pr.status === "merged";

                        return (
                            <div
                                key={pr._id}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                    padding: "12px 16px",
                                    borderBottom: "1px solid var(--color-border-muted)",
                                    gap: "12px",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-canvas-subtle)")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", minWidth: 0 }}>
                                    <span style={{ marginTop: "2px" }}>
                                        {isOpen ? (
                                            <GitPullRequestIcon size={16} fill="var(--color-success-fg)" />
                                        ) : isMerged ? (
                                            <GitMergeIcon size={16} fill="#8957e5" />
                                        ) : (
                                            <GitPullRequestClosedIcon size={16} fill="var(--color-danger-fg)" />
                                        )}
                                    </span>

                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                            <Link
                                                to={`${basePath}/pulls/${pr.number}`}
                                                style={{
                                                    color: "var(--color-fg-default)",
                                                    fontWeight: 600,
                                                    fontSize: "14px",
                                                    textDecoration: "none",
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent-fg)")}
                                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-fg-default)")}
                                            >
                                                {pr.title}
                                            </Link>

                                            {/* Branch Badges: source -> target */}
                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    backgroundColor: "var(--color-border-muted)",
                                                    padding: "1px 8px",
                                                    borderRadius: "12px",
                                                    fontSize: "11px",
                                                    fontFamily: "monospace",
                                                    color: "var(--color-fg-muted)",
                                                }}
                                            >
                                                <span>{pr.sourceBranch}</span>
                                                <ArrowRightIcon size={10} />
                                                <span>{pr.targetBranch}</span>
                                            </span>
                                        </div>

                                        <div style={{ fontSize: "12px", color: "var(--color-fg-muted)", marginTop: "4px" }}>
                                            #{pr.number} opened {formatDate(pr.createdAt)} by{" "}
                                            <strong>{pr.author?.username || "Unknown"}</strong>
                                            {isMerged && " • Merged"}
                                        </div>
                                    </div>
                                </div>

                                {pr.commentsCount > 0 && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--color-fg-muted)", fontSize: "12px" }}>
                                        <CommentIcon size={14} />
                                        <span>{pr.commentsCount}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default PullRequestList;
