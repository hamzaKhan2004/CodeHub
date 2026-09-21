import { useState } from "react";
import { Link, useNavigate } from "react-router";
import BranchDropdown from "./BranchDropdown";
import MarkdownViewer from "./MarkdownViewer";
import QuickSetup from "./QuickSetup";
import { formatDate } from "../../core/utils/dateFormatter";
import {
    FileDirectoryIcon,
    FileIcon,
    HistoryIcon,
    PlusIcon,
} from "@primer/octicons-react";

export const FileTree = ({
    owner,
    repoName,
    branch,
    branches = [],
    currentPath = "",
    tree = [],
    readme = null,
    latestCommit = null,
    onSelectBranch,
    onCreateBranch,
    canEdit = false,
}) => {
    const navigate = useNavigate();
    const [addFileOpen, setAddFileOpen] = useState(false);

    const basePath = `/${owner}/${repoName}`;
    const pathParts = currentPath ? currentPath.split("/") : [];

    return (
        <div>
            {/* Action Bar: Branch Dropdown, Path Breadcrumbs & Add File Button */}
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
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <BranchDropdown
                        currentBranch={branch}
                        branches={branches}
                        onSelectBranch={onSelectBranch}
                        onCreateBranch={onCreateBranch}
                    />

                    {/* Path Breadcrumbs */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                        <Link to={basePath} style={{ fontWeight: 600 }}>
                            {repoName}
                        </Link>
                        {pathParts.map((part, idx) => {
                            const subPath = pathParts.slice(0, idx + 1).join("/");
                            const isLast = idx === pathParts.length - 1;
                            return (
                                <span key={subPath} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ color: "var(--color-fg-muted)" }}>/</span>
                                    {isLast ? (
                                        <strong style={{ color: "var(--color-fg-default)" }}>{part}</strong>
                                    ) : (
                                        <Link to={`${basePath}/tree/${branch}/${subPath}`}>{part}</Link>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Right: History & Add File */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Link
                        to={`${basePath}/commits/${branch}`}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid var(--color-border-default)",
                            backgroundColor: "var(--color-canvas-default)",
                            color: "var(--color-fg-default)",
                            fontSize: "13px",
                            fontWeight: 500,
                            textDecoration: "none",
                        }}
                    >
                        <HistoryIcon size={14} />
                        <span>Commits</span>
                    </Link>

                    {canEdit && (
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={() => setAddFileOpen((prev) => !prev)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--color-border-default)",
                                    backgroundColor: "var(--color-canvas-default)",
                                    color: "var(--color-fg-default)",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                }}
                            >
                                <PlusIcon size={14} />
                                <span>Add file</span>
                                <span style={{ fontSize: "10px" }}>▼</span>
                            </button>

                            {addFileOpen && (
                                <div
                                    style={{
                                        position: "absolute",
                                        right: 0,
                                        top: "100%",
                                        marginTop: "4px",
                                        backgroundColor: "var(--color-canvas-overlay)",
                                        border: "1px solid var(--color-border-default)",
                                        borderRadius: "6px",
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                                        width: "160px",
                                        zIndex: 50,
                                        padding: "4px 0",
                                    }}
                                >
                                    <button
                                        onClick={() => {
                                            setAddFileOpen(false);
                                            const newPath = currentPath ? `${currentPath}/new-file.txt` : "new-file.txt";
                                            navigate(`${basePath}/edit/${branch}/${newPath}`);
                                        }}
                                        style={{
                                            width: "100%",
                                            textAlign: "left",
                                            padding: "8px 16px",
                                            backgroundColor: "transparent",
                                            border: "none",
                                            color: "var(--color-fg-default)",
                                            fontSize: "13px",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-border-muted)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                    >
                                        Create new file
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* File Table Container */}
            <div
                style={{
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "6px",
                    overflow: "hidden",
                    backgroundColor: "var(--color-canvas-default)",
                }}
            >
                {/* Latest Commit Bar */}
                {latestCommit && (
                    <div
                        style={{
                            backgroundColor: "var(--color-canvas-subtle)",
                            padding: "10px 16px",
                            borderBottom: "1px solid var(--color-border-default)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "13px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {latestCommit.author?.avatarUrl && (
                                <img
                                    src={latestCommit.author.avatarUrl}
                                    alt={latestCommit.author.username}
                                    style={{ width: "20px", height: "20px", borderRadius: "50%" }}
                                />
                            )}
                            <strong style={{ color: "var(--color-fg-default)" }}>
                                {latestCommit.author?.username || "Unknown"}
                            </strong>
                            <span style={{ color: "var(--color-fg-muted)" }}>
                                {latestCommit.message}
                            </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <Link
                                to={`${basePath}/commit/${latestCommit.sha}`}
                                style={{
                                    fontFamily: "monospace",
                                    fontSize: "12px",
                                    color: "var(--color-accent-fg)",
                                }}
                            >
                                {latestCommit.sha.substring(0, 7)}
                            </Link>
                            <span style={{ color: "var(--color-fg-muted)", fontSize: "12px" }}>
                                {formatDate(latestCommit.createdAt)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Parent Directory Link if inside subfolder */}
                {currentPath && (
                    <div
                        style={{
                            padding: "10px 16px",
                            borderBottom: "1px solid var(--color-border-muted)",
                            backgroundColor: "var(--color-canvas-subtle)",
                        }}
                    >
                        <Link
                            to={
                                pathParts.length > 1
                                    ? `${basePath}/tree/${branch}/${pathParts.slice(0, -1).join("/")}`
                                    : basePath
                            }
                            style={{ color: "var(--color-accent-fg)", fontWeight: 600 }}
                        >
                            ..
                        </Link>
                    </div>
                )}

                {/* File / Folder Rows */}
                {tree.length === 0 ? (
                    !currentPath && !latestCommit ? (
                        <div style={{ padding: "20px" }}>
                            <QuickSetup owner={owner} repoName={repoName} branch={branch} basePath={basePath} />
                        </div>
                    ) : (
                        <div style={{ padding: "32px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                            This directory is empty.
                        </div>
                    )
                ) : (
                    tree.map((item) => {
                        const isDir = item.type === "dir";
                        const linkTo = isDir
                            ? `${basePath}/tree/${branch}/${item.path}`
                            : `${basePath}/blob/${branch}/${item.path}`;

                        return (
                            <div
                                key={item.path}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "minmax(200px, 3fr) 5fr 2fr",
                                    alignItems: "center",
                                    padding: "8px 16px",
                                    borderBottom: "1px solid var(--color-border-muted)",
                                    fontSize: "13px",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-canvas-subtle)")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                                    {isDir ? (
                                        <FileDirectoryIcon size={16} fill="var(--color-accent-fg)" />
                                    ) : (
                                        <FileIcon size={16} fill="var(--color-fg-muted)" />
                                    )}
                                    <Link
                                        to={linkTo}
                                        style={{
                                            color: "var(--color-fg-default)",
                                            textDecoration: "none",
                                            fontWeight: isDir ? 500 : 400,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                                    >
                                        {item.name}
                                    </Link>
                                </div>

                                <div
                                    style={{
                                        color: "var(--color-fg-muted)",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        paddingRight: "12px",
                                    }}
                                >
                                    {item.lastCommitMessage || "Initial commit"}
                                </div>

                                <div style={{ textAlign: "right", color: "var(--color-fg-muted)", fontSize: "12px" }}>
                                    {formatDate(item.lastCommitDate)}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* README Preview if available */}
            {readme && <MarkdownViewer content={readme.content} title={readme.path} />}
        </div>
    );
};

export default FileTree;
