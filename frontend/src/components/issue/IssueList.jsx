import { Link } from "react-router";
import { formatDate } from "../../core/utils/dateFormatter";
import {
    IssueOpenedIcon,
    IssueClosedIcon,
    CommentIcon,
    SearchIcon,
} from "@primer/octicons-react";

export const IssueList = ({
    owner,
    repoName,
    issues = [],
    status = "open",
    setStatus,
    search,
    setSearch,
    counts = { open: 0, closed: 0 },
    loading = false,
}) => {
    const basePath = `/${owner}/${repoName}`;

    return (
        <div>
            {/* Top Filter and Actions Bar */}
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
                {/* Search Input */}
                <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                    <input
                        type="text"
                        placeholder="Search all issues..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "6px 12px 6px 32px",
                            backgroundColor: "var(--color-canvas-default)",
                            border: "1px solid var(--color-border-default)",
                            borderRadius: "6px",
                            color: "var(--color-fg-default)",
                            fontSize: "13px",
                            outline: "none",
                        }}
                    />
                    <span style={{ position: "absolute", left: "10px", top: "7px", color: "var(--color-fg-muted)" }}>
                        <SearchIcon size={16} />
                    </span>
                </div>

                {/* New Issue Button */}
                <Link
                    to={`${basePath}/issues/new`}
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
                    New issue
                </Link>
            </div>

            {/* Issues Table Container */}
            <div
                style={{
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "6px",
                    overflow: "hidden",
                    backgroundColor: "var(--color-canvas-default)",
                }}
            >
                {/* Status Tabs Header (Open vs. Closed) */}
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
                        <IssueOpenedIcon size={16} fill={status === "open" ? "var(--color-success-fg)" : "currentColor"} />
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
                        <IssueClosedIcon size={16} fill={status === "closed" ? "#8957e5" : "currentColor"} />
                        <span>{counts.closed} Closed</span>
                    </button>
                </div>

                {/* Issue Items */}
                {loading ? (
                    <div style={{ padding: "32px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                        Loading issues...
                    </div>
                ) : issues.length === 0 ? (
                    <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                        <IssueOpenedIcon size={32} style={{ marginBottom: "12px", opacity: 0.6 }} />
                        <h3>No {status} issues found</h3>
                        <p style={{ fontSize: "13px", marginTop: "4px" }}>
                            {search ? "No issues matched your search query." : "There are currently no issues in this state."}
                        </p>
                    </div>
                ) : (
                    issues.map((issue) => {
                        const isOpen = issue.status === "open";
                        return (
                            <div
                                key={issue._id}
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
                                            <IssueOpenedIcon size={16} fill="var(--color-success-fg)" />
                                        ) : (
                                            <IssueClosedIcon size={16} fill="#8957e5" />
                                        )}
                                    </span>

                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                            <Link
                                                to={`${basePath}/issues/${issue.issueNumber}`}
                                                style={{
                                                    color: "var(--color-fg-default)",
                                                    fontWeight: 600,
                                                    fontSize: "14px",
                                                    textDecoration: "none",
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent-fg)")}
                                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-fg-default)")}
                                            >
                                                {issue.title}
                                            </Link>

                                            {/* Labels */}
                                            {issue.labels?.map((label) => (
                                                <span
                                                    key={label}
                                                    style={{
                                                        backgroundColor: "var(--color-border-muted)",
                                                        color: "var(--color-fg-muted)",
                                                        padding: "1px 8px",
                                                        borderRadius: "12px",
                                                        fontSize: "11px",
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {label}
                                                </span>
                                            ))}
                                        </div>

                                        <div style={{ fontSize: "12px", color: "var(--color-fg-muted)", marginTop: "4px" }}>
                                            #{issue.issueNumber} opened {formatDate(issue.createdAt)} by{" "}
                                            <strong>{issue.author?.username || "Unknown"}</strong>
                                        </div>
                                    </div>
                                </div>

                                {issue.commentsCount > 0 && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--color-fg-muted)", fontSize: "12px" }}>
                                        <CommentIcon size={14} />
                                        <span>{issue.commentsCount}</span>
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

export default IssueList;
