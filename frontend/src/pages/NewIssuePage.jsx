import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useRepo } from "../hooks/useRepo";
import { useAuth } from "../hooks/useAuth";
import issueService from "../services/issueService";
import RepoLayout from "../layouts/RepoLayout";

export const NewIssuePage = () => {
    const { owner, repo: repoName } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { repo } = useRepo(owner, repoName);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError("Issue title cannot be empty.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const issue = await issueService.createIssue(repo._id, {
                title: title.trim(),
                description: description.trim(),
            });
            navigate(`/${owner}/${repoName}/issues/${issue.issueNumber}`);
        } catch (err) {
            setError(err.message || "Failed to create issue.");
            setLoading(false);
        }
    };

    return (
        <RepoLayout>
            <div style={{ maxWidth: "880px", margin: "0 auto" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px" }}>Create a new issue</h2>

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

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                            Title
                        </label>
                        <input
                            type="text"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
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
                            placeholder="Leave a comment or describe the issue..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={8}
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

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                        <button
                            type="button"
                            onClick={() => navigate(`/${owner}/${repoName}/issues`)}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "6px",
                                border: "1px solid var(--color-border-default)",
                                backgroundColor: "transparent",
                                color: "var(--color-fg-default)",
                            }}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading || !title.trim()}
                            style={{
                                padding: "8px 18px",
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: "var(--color-success-emphasis)",
                                color: "white",
                                fontWeight: 600,
                            }}
                        >
                            {loading ? "Submitting..." : "Submit new issue"}
                        </button>
                    </div>
                </form>
            </div>
        </RepoLayout>
    );
};

export default NewIssuePage;
