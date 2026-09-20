import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { useRepo } from "../hooks/useRepo";
import codeService from "../services/codeService";
import RepoLayout from "../layouts/RepoLayout";
import DiffViewer from "../components/repo/DiffViewer";
import { formatDate } from "../core/utils/dateFormatter";
import { GitCommitIcon } from "@primer/octicons-react";

export const CommitDetailPage = () => {
    const { owner, repo: repoName, sha } = useParams();
    const { repo } = useRepo(owner, repoName);

    const [commit, setCommit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadCommit = async () => {
            if (!repo?._id || !sha) return;
            setLoading(true);
            setError(null);
            try {
                const data = await codeService.getCommitBySha(repo._id, sha);
                setCommit(data);
            } catch (err) {
                setError(err.message || "Failed to load commit details.");
            } finally {
                setLoading(false);
            }
        };

        loadCommit();
    }, [repo?._id, sha]);

    return (
        <RepoLayout>
            {loading ? (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                    Loading commit details...
                </div>
            ) : error || !commit ? (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                    <h3>Commit not found</h3>
                    <p style={{ color: "var(--color-fg-muted)", margin: "8px 0 16px" }}>{error}</p>
                    <Link to={`/${owner}/${repoName}`}>Back to code</Link>
                </div>
            ) : (
                <div>
                    {/* Commit Header Box */}
                    <div
                        style={{
                            border: "1px solid var(--color-border-default)",
                            borderRadius: "6px",
                            backgroundColor: "var(--color-canvas-subtle)",
                            padding: "16px 20px",
                            marginBottom: "24px",
                        }}
                    >
                        <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 12px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <GitCommitIcon size={20} />
                            {commit.message}
                        </h2>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: "12px",
                                fontSize: "13px",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                {commit.author?.avatarUrl && (
                                    <img
                                        src={commit.author.avatarUrl}
                                        alt={commit.author.username}
                                        style={{ width: "24px", height: "24px", borderRadius: "50%" }}
                                    />
                                )}
                                <strong>{commit.author?.username || "Unknown"}</strong>
                                <span style={{ color: "var(--color-fg-muted)" }}>
                                    committed {formatDate(commit.createdAt)}
                                </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontFamily: "monospace", fontSize: "12px" }}>
                                <span>
                                    commit <strong style={{ color: "var(--color-accent-fg)" }}>{commit.sha}</strong>
                                </span>
                                {commit.parentCommit && (
                                    <Link
                                        to={`/${owner}/${repoName}/commit/${commit.parentCommit.sha}`}
                                        style={{ color: "var(--color-fg-muted)" }}
                                    >
                                        parent {commit.parentCommit.sha.substring(0, 7)}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Files Changed Summary Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: 600 }}>
                            Showing {commit.filesChanged?.length || 0} changed files with{" "}
                            <span style={{ color: "var(--color-diff-add-fg)" }}>+{commit.stats?.totalAdditions || 0}</span> additions and{" "}
                            <span style={{ color: "var(--color-diff-del-fg)" }}>-{commit.stats?.totalDeletions || 0}</span> deletions
                        </h3>
                    </div>

                    {/* Diff View */}
                    <DiffViewer diffs={commit.filesChanged || []} />
                </div>
            )}
        </RepoLayout>
    );
};

export default CommitDetailPage;
