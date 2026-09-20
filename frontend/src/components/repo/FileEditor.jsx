import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { GitCommitIcon } from "@primer/octicons-react";

export const FileEditor = ({
    owner,
    repoName,
    branch = "main",
    initialPath = "",
    initialContent = "",
    isNew = false,
    onSave,
}) => {
    const navigate = useNavigate();
    const [filePath, setFilePath] = useState(initialPath);
    const [content, setContent] = useState(initialContent);
    const [commitMessage, setCommitMessage] = useState(
        isNew ? `Create ${initialPath || "new-file.txt"}` : `Update ${initialPath}`
    );
    const [commitDescription, setCommitDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const basePath = `/${owner}/${repoName}`;

    const handleSave = async (e) => {
        e.preventDefault();
        if (!filePath.trim()) {
            setError("File name cannot be empty.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            await onSave({
                path: filePath.trim(),
                content,
                message: commitMessage.trim() || `Update ${filePath.trim()}`,
            });
            navigate(`${basePath}/blob/${branch}/${filePath.trim()}`);
        } catch (err) {
            setError(err.message || "Failed to commit file.");
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
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

            {/* Path & File Name Input Bar */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    backgroundColor: "var(--color-canvas-subtle)",
                    border: "1px solid var(--color-border-default)",
                    borderTopLeftRadius: "6px",
                    borderTopRightRadius: "6px",
                }}
            >
                <span style={{ color: "var(--color-fg-muted)", fontSize: "14px" }}>
                    <Link to={basePath}>{repoName}</Link> /
                </span>
                <input
                    type="text"
                    placeholder="Name your file..."
                    value={filePath}
                    onChange={(e) => {
                        setFilePath(e.target.value);
                        if (isNew) {
                            setCommitMessage(`Create ${e.target.value}`);
                        }
                    }}
                    style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "1px solid var(--color-border-default)",
                        backgroundColor: "var(--color-canvas-default)",
                        color: "var(--color-fg-default)",
                        fontSize: "13px",
                        minWidth: "260px",
                    }}
                />
                <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
                    in <strong>{branch}</strong>
                </span>
            </div>

            {/* Code Textarea Editor */}
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                placeholder="Type your code or text here..."
                style={{
                    width: "100%",
                    padding: "16px",
                    backgroundColor: "var(--color-canvas-default)",
                    color: "var(--color-fg-default)",
                    border: "1px solid var(--color-border-default)",
                    borderTop: "none",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                }}
            />

            {/* Commit Changes Section */}
            <div
                style={{
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "6px",
                    padding: "20px",
                    marginTop: "20px",
                    backgroundColor: "var(--color-canvas-subtle)",
                }}
            >
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <GitCommitIcon size={18} />
                    Commit changes
                </h3>

                <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px", color: "var(--color-fg-default)" }}>
                        Commit message
                    </label>
                    <input
                        type="text"
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="Add a commit message..."
                        style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid var(--color-border-default)",
                            backgroundColor: "var(--color-canvas-default)",
                            color: "var(--color-fg-default)",
                            fontSize: "13px",
                        }}
                    />
                </div>

                <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px", color: "var(--color-fg-default)" }}>
                        Extended description (optional)
                    </label>
                    <textarea
                        value={commitDescription}
                        onChange={(e) => setCommitDescription(e.target.value)}
                        placeholder="Add an optional extended description..."
                        rows={3}
                        style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid var(--color-border-default)",
                            backgroundColor: "var(--color-canvas-default)",
                            color: "var(--color-fg-default)",
                            fontSize: "13px",
                        }}
                    />
                </div>

                {/* Commit Action Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        onClick={handleSave}
                        disabled={loading || !filePath.trim()}
                        style={{
                            padding: "8px 18px",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: "var(--color-success-emphasis)",
                            color: "white",
                            fontWeight: 600,
                            fontSize: "14px",
                        }}
                    >
                        {loading ? "Committing..." : "Commit changes"}
                    </button>

                    <Link
                        to={initialPath ? `${basePath}/blob/${branch}/${initialPath}` : basePath}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            border: "1px solid var(--color-border-default)",
                            backgroundColor: "var(--color-canvas-default)",
                            color: "var(--color-fg-default)",
                            fontSize: "14px",
                            textDecoration: "none",
                        }}
                    >
                        Cancel
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FileEditor;
