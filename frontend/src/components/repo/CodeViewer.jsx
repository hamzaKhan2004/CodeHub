import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { getLanguageFromFilename } from "../../core/utils/languageDetector";
import {
    PencilIcon,
    TrashIcon,
    CopyIcon,
    CheckIcon,
    CodeIcon,
} from "@primer/octicons-react";

export const CodeViewer = ({
    owner,
    repoName,
    branch,
    filePath,
    content = "",
    size = 0,
    canEdit = false,
    onDeleteFile,
}) => {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const basePath = `/${owner}/${repoName}`;
    const lines = content.split("\n");
    const lang = getLanguageFromFilename(filePath);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete '${filePath}'?`)) {
            setDeleting(true);
            try {
                if (onDeleteFile) {
                    await onDeleteFile(filePath);
                }
            } catch (err) {
                alert(err.message || "Failed to delete file.");
                setDeleting(false);
            }
        }
    };

    return (
        <div
            style={{
                border: "1px solid var(--color-border-default)",
                borderRadius: "6px",
                overflow: "hidden",
                backgroundColor: "var(--color-canvas-default)",
            }}
        >
            {/* File Header Bar */}
            <div
                style={{
                    backgroundColor: "var(--color-canvas-subtle)",
                    padding: "8px 16px",
                    borderBottom: "1px solid var(--color-border-default)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                }}
            >
                {/* File Details: Lines, Size, Language */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--color-fg-muted)" }}>
                    <span style={{ fontWeight: 600, color: "var(--color-fg-default)" }}>{filePath}</span>
                    <span>•</span>
                    <span>{lines.length} lines</span>
                    <span>•</span>
                    <span>{size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} Bytes`}</span>
                    <span>•</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span
                            style={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                backgroundColor: lang.color,
                                display: "inline-block",
                            }}
                        />
                        {lang.name}
                    </span>
                </div>

                {/* Right Actions: Copy, Raw, Edit, Delete */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                        onClick={handleCopy}
                        title="Copy raw contents"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 8px",
                            backgroundColor: "var(--color-canvas-default)",
                            border: "1px solid var(--color-border-default)",
                            borderRadius: "4px",
                            color: "var(--color-fg-default)",
                            fontSize: "12px",
                        }}
                    >
                        {copied ? <CheckIcon size={14} fill="var(--color-success-fg)" /> : <CopyIcon size={14} />}
                        <span>{copied ? "Copied!" : "Copy"}</span>
                    </button>

                    {canEdit && (
                        <>
                            <Link
                                to={`${basePath}/edit/${branch}/${filePath}`}
                                title="Edit this file"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "4px 8px",
                                    backgroundColor: "var(--color-canvas-default)",
                                    border: "1px solid var(--color-border-default)",
                                    borderRadius: "4px",
                                    color: "var(--color-fg-default)",
                                    fontSize: "12px",
                                    textDecoration: "none",
                                }}
                            >
                                <PencilIcon size={14} />
                            </Link>

                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                title="Delete this file"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "4px 8px",
                                    backgroundColor: "var(--color-canvas-default)",
                                    border: "1px solid var(--color-border-default)",
                                    borderRadius: "4px",
                                    color: "var(--color-danger-fg)",
                                    fontSize: "12px",
                                }}
                            >
                                <TrashIcon size={14} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Code Lines with Line Numbers */}
            <div style={{ overflowX: "auto", fontFamily: "monospace", fontSize: "12px", lineHeight: "20px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                        {lines.map((lineText, idx) => (
                            <tr key={idx} style={{ verticalAlign: "top" }}>
                                <td
                                    style={{
                                        width: "48px",
                                        padding: "0 12px",
                                        textAlign: "right",
                                        color: "var(--color-fg-subtle)",
                                        userSelect: "none",
                                        borderRight: "1px solid var(--color-border-muted)",
                                    }}
                                >
                                    {idx + 1}
                                </td>
                                <td
                                    style={{
                                        padding: "0 16px",
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-all",
                                        color: "var(--color-fg-default)",
                                    }}
                                >
                                    {lineText || "\u00A0"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CodeViewer;
