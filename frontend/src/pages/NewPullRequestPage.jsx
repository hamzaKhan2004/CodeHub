import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useRepo } from "../hooks/useRepo";
import { useFileTree } from "../hooks/useFileTree";
import prService from "../services/prService";
import codeService from "../services/codeService";
import RepoLayout from "../layouts/RepoLayout";
import DiffViewer from "../components/repo/DiffViewer";
import { GitPullRequestIcon, ArrowRightIcon } from "@primer/octicons-react";

export const NewPullRequestPage = () => {
    const { owner, repo: repoName } = useParams();
    const navigate = useNavigate();
    const { repo } = useRepo(owner, repoName);
    const { branches } = useFileTree(repo?._id, repo?.defaultBranch);

    const [sourceBranch, setSourceBranch] = useState("");
    const [targetBranch, setTargetBranch] = useState(repo?.defaultBranch || "main");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [diffPreview, setDiffPreview] = useState([]);
    const [loadingDiff, setLoadingDiff] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Set initial source branch to first branch that is not target
    useEffect(() => {
        if (branches.length > 0 && !sourceBranch) {
            const nonDefault = branches.find((b) => b.name !== (repo?.defaultBranch || "main"));
            if (nonDefault) {
                setSourceBranch(nonDefault.name);
                setTitle(`Merge ${nonDefault.name} into ${repo?.defaultBranch || "main"}`);
            } else {
                setSourceBranch(branches[0].name);
            }
        }
    }, [branches, repo?.defaultBranch, sourceBranch]);

    // Fetch comparison preview whenever branches change
    useEffect(() => {
        const compareBranches = async () => {
            if (!repo?._id || !sourceBranch || !targetBranch || sourceBranch === targetBranch) {
                setDiffPreview([]);
                return;
            }

            setLoadingDiff(true);
            try {
                // Fetch files of both branches and compare
                const [srcFiles, tgtFiles] = await Promise.all([
                    codeService.getFileTree(repo._id, sourceBranch, ""),
                    codeService.getFileTree(repo._id, targetBranch, ""),
                ]);

                // Map comparisons
                const previewDiffs = [];
                const srcTree = srcFiles.tree || [];
                const tgtTree = tgtFiles.tree || [];

                for (const item of srcTree) {
                    if (item.type === "file") {
                        const [srcContent, tgtContent] = await Promise.all([
                            codeService.getFileContent(repo._id, sourceBranch, item.path).catch(() => ({ content: "" })),
                            codeService.getFileContent(repo._id, targetBranch, item.path).catch(() => ({ content: "" })),
                        ]);

                        if (srcContent.content !== tgtContent.content) {
                            previewDiffs.push({
                                path: item.path,
                                status: tgtContent.content ? "modified" : "added",
                                oldContent: tgtContent.content,
                                newContent: srcContent.content,
                                additions: srcContent.content ? srcContent.content.split("\n").length : 0,
                                deletions: tgtContent.content ? tgtContent.content.split("\n").length : 0,
                            });
                        }
                    }
                }

                setDiffPreview(previewDiffs);
            } catch (err) {
                console.error("Diff preview error:", err);
            } finally {
                setLoadingDiff(false);
            }
        };

        compareBranches();
    }, [repo?._id, sourceBranch, targetBranch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError("Pull request title is required.");
            return;
        }

        if (sourceBranch === targetBranch) {
            setError("Source branch and target branch must be different.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const pr = await prService.createPullRequest(repo._id, {
                title: title.trim(),
                description: description.trim(),
                sourceBranch,
                targetBranch,
            });
            navigate(`/${owner}/${repoName}/pulls/${pr.number}`);
        } catch (err) {
            setError(err.message || "Failed to create pull request.");
            setSubmitting(false);
        }
    };

    return (
        <RepoLayout>
            <div style={{ maxWidth: "980px", margin: "0 auto" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <GitPullRequestIcon size={20} />
                    Open a pull request
                </h2>

                {error && (
                    <div
                        style={{
                            padding: "12px",
                            backgroundColor: "var(--color-diff-del-bg)",
                            color: "var(--color-danger-fg)",
                            border: "1px solid var(--color-danger-emphasis)",
                            borderRadius: "6px",
                            marginBottom: "16px",
                            fontSize: "13px",
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Branch Comparator Header Box */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        backgroundColor: "var(--color-canvas-subtle)",
                        padding: "12px 16px",
                        borderRadius: "6px",
                        border: "1px solid var(--color-border-default)",
                        marginBottom: "24px",
                        fontSize: "13px",
                        flexWrap: "wrap",
                    }}
                >
                    <span style={{ fontWeight: 600 }}>Compare changes</span>
                    <span>base:</span>
                    <select
                        value={targetBranch}
                        onChange={(e) => setTargetBranch(e.target.value)}
                        style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid var(--color-border-default)",
                            backgroundColor: "var(--color-canvas-default)",
                            color: "var(--color-fg-default)",
                        }}
                    >
                        {branches.map((b) => (
                            <option key={b.name} value={b.name}>
                                {b.name}
                            </option>
                        ))}
                    </select>

                    <ArrowRightIcon size={14} style={{ color: "var(--color-fg-muted)" }} />

                    <span>compare:</span>
                    <select
                        value={sourceBranch}
                        onChange={(e) => {
                            setSourceBranch(e.target.value);
                            setTitle(`Merge ${e.target.value} into ${targetBranch}`);
                        }}
                        style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid var(--color-border-default)",
                            backgroundColor: "var(--color-canvas-default)",
                            color: "var(--color-fg-default)",
                        }}
                    >
                        {branches.map((b) => (
                            <option key={b.name} value={b.name}>
                                {b.name}
                            </option>
                        ))}
                    </select>

                    <span style={{ color: "var(--color-success-fg)", fontSize: "12px", marginLeft: "auto" }}>
                        ✔ Able to merge.
                    </span>
                </div>

                {/* Pull Request Details Form */}
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                            Title
                        </label>
                        <input
                            type="text"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                backgroundColor: "var(--color-canvas-default)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "6px",
                                color: "var(--color-fg-default)",
                                fontSize: "14px",
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                            Description
                        </label>
                        <textarea
                            placeholder="Leave a comment describing the changes..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            style={{
                                width: "100%",
                                padding: "12px",
                                backgroundColor: "var(--color-canvas-default)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "6px",
                                color: "var(--color-fg-default)",
                                fontSize: "13px",
                                outline: "none",
                                resize: "vertical",
                            }}
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={submitting || !title.trim() || sourceBranch === targetBranch}
                            style={{
                                padding: "8px 20px",
                                backgroundColor: "var(--color-success-emphasis)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontWeight: 600,
                                fontSize: "14px",
                            }}
                        >
                            {submitting ? "Creating..." : "Create pull request"}
                        </button>
                    </div>
                </form>

                {/* Diff Preview Header */}
                <div style={{ borderTop: "1px solid var(--color-border-default)", paddingTop: "20px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
                        Diff Preview ({diffPreview.length} files changed)
                    </h3>
                    {loadingDiff ? (
                        <div style={{ color: "var(--color-fg-muted)", fontSize: "13px" }}>Comparing branches...</div>
                    ) : (
                        <DiffViewer diffs={diffPreview} />
                    )}
                </div>
            </div>
        </RepoLayout>
    );
};

export default NewPullRequestPage;
