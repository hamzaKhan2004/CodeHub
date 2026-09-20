import { Link } from "react-router";
import { formatDate } from "../../core/utils/dateFormatter";
import { GitCommitIcon } from "@primer/octicons-react";

export const CommitList = ({ owner, repoName, branch = "main", commits = [], loading = false }) => {
    const basePath = `/${owner}/${repoName}`;

    if (loading) {
        return (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                Loading commits...
            </div>
        );
    }

    if (commits.length === 0) {
        return (
            <div
                style={{
                    padding: "48px 24px",
                    textAlign: "center",
                    border: "1px dashed var(--color-border-default)",
                    borderRadius: "6px",
                    color: "var(--color-fg-muted)",
                }}
            >
                No commits found for branch <strong>{branch}</strong>.
            </div>
        );
    }

    return (
        <div style={{ border: "1px solid var(--color-border-default)", borderRadius: "6px", overflow: "hidden" }}>
            <div
                style={{
                    backgroundColor: "var(--color-canvas-subtle)",
                    padding: "10px 16px",
                    borderBottom: "1px solid var(--color-border-default)",
                    fontWeight: 600,
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                <GitCommitIcon size={16} />
                <span>Commits on {branch}</span>
            </div>

            <div style={{ backgroundColor: "var(--color-canvas-default)" }}>
                {commits.map((commit) => (
                    <div
                        key={commit.sha}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            borderBottom: "1px solid var(--color-border-muted)",
                            gap: "12px",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-canvas-subtle)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", minWidth: 0 }}>
                            {commit.author?.avatarUrl && (
                                <img
                                    src={commit.author.avatarUrl}
                                    alt={commit.author.username}
                                    style={{ width: "24px", height: "24px", borderRadius: "50%", marginTop: "2px" }}
                                />
                            )}
                            <div style={{ minWidth: 0 }}>
                                <Link
                                    to={`${basePath}/commit/${commit.sha}`}
                                    style={{
                                        color: "var(--color-fg-default)",
                                        fontWeight: 600,
                                        fontSize: "14px",
                                        textDecoration: "none",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent-fg)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-fg-default)")}
                                >
                                    {commit.message}
                                </Link>
                                <div style={{ fontSize: "12px", color: "var(--color-fg-muted)", marginTop: "4px" }}>
                                    <strong>{commit.author?.username || "Unknown"}</strong> committed{" "}
                                    {formatDate(commit.createdAt)}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                            <Link
                                to={`${basePath}/commit/${commit.sha}`}
                                style={{
                                    fontFamily: "monospace",
                                    fontSize: "12px",
                                    padding: "3px 8px",
                                    borderRadius: "4px",
                                    border: "1px solid var(--color-border-default)",
                                    backgroundColor: "var(--color-canvas-default)",
                                    color: "var(--color-accent-fg)",
                                    textDecoration: "none",
                                }}
                            >
                                {commit.sha.substring(0, 7)}
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CommitList;
