import { useState } from "react";
import { Link } from "react-router";
import { CopyIcon, CheckIcon, TerminalIcon, FileCodeIcon, CloudIcon } from "@primer/octicons-react";

export const QuickSetup = ({ owner, repoName, branch = "main", basePath }) => {
    const [copiedSnippet, setCopiedSnippet] = useState(null);

    const repoIdentifier = `${owner}/${repoName}`;

    const newRepoSnippet = `mygit init ${repoIdentifier}
mygit add .
mygit commit "Initial commit"
mygit push`;

    const existingRepoSnippet = `mygit init ${repoIdentifier}
mygit push`;

    const pullRepoSnippet = `mygit pull ${repoIdentifier}`;

    const copyToClipboard = (text, snippetId) => {
        navigator.clipboard.writeText(text);
        setCopiedSnippet(snippetId);
        setTimeout(() => setCopiedSnippet(null), 2000);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Quick Setup Card */}
            <div
                style={{
                    backgroundColor: "var(--color-canvas-default)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "6px",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        backgroundColor: "var(--color-canvas-subtle)",
                        padding: "16px 20px",
                        borderBottom: "1px solid var(--color-border-default)",
                    }}
                >
                    <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
                        Quick setup — if you've done this kind of thing before
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--color-fg-muted)", margin: "4px 0 0" }}>
                        Initialize this repository locally using CodeHub's custom VCS (<code style={{ color: "var(--color-accent-fg)" }}>mygit</code>) and push directly to AWS S3.
                    </p>

                    {/* Repository Identifier Bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "4px 10px",
                                fontSize: "12px",
                                fontWeight: 600,
                                borderRadius: "6px",
                                backgroundColor: "var(--color-accent-emphasis)",
                                color: "white",
                            }}
                        >
                            <CloudIcon size={14} />
                            AWS S3 Powered
                        </div>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                flex: 1,
                                minWidth: "260px",
                                backgroundColor: "var(--color-canvas-subtle)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "6px",
                                padding: "4px 8px",
                            }}
                        >
                            <code style={{ flex: 1, fontSize: "13px", color: "var(--color-fg-default)", fontWeight: 600 }}>
                                {repoIdentifier}
                            </code>
                            <button
                                onClick={() => copyToClipboard(repoIdentifier, "repoId")}
                                title="Copy repository target"
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    color: "var(--color-fg-muted)",
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "4px",
                                }}
                            >
                                {copiedSnippet === "repoId" ? <CheckIcon size={14} fill="var(--color-success-fg)" /> : <CopyIcon size={14} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ padding: "20px" }}>
                    {/* Snippet 1: Create a new repository on the command line */}
                    <div style={{ marginBottom: "24px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <h4 style={{ fontSize: "14px", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                                <TerminalIcon size={14} /> …or create a new repository on the command line
                            </h4>
                            <button
                                onClick={() => copyToClipboard(newRepoSnippet, "newRepo")}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "12px",
                                    padding: "3px 8px",
                                    borderRadius: "4px",
                                    border: "1px solid var(--color-border-default)",
                                    backgroundColor: "var(--color-canvas-subtle)",
                                    color: "var(--color-fg-default)",
                                    cursor: "pointer",
                                }}
                            >
                                {copiedSnippet === "newRepo" ? <CheckIcon size={12} fill="var(--color-success-fg)" /> : <CopyIcon size={12} />}
                                {copiedSnippet === "newRepo" ? "Copied" : "Copy"}
                            </button>
                        </div>

                        <pre
                            style={{
                                backgroundColor: "var(--color-canvas-subtle)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "6px",
                                padding: "12px 16px",
                                fontSize: "12px",
                                lineHeight: "1.6",
                                fontFamily: "monospace",
                                color: "var(--color-fg-default)",
                                overflowX: "auto",
                                margin: 0,
                            }}
                        >
                            {newRepoSnippet}
                        </pre>
                    </div>

                    {/* Snippet 2: Push an existing repository from command line */}
                    <div style={{ marginBottom: "24px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <h4 style={{ fontSize: "14px", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                                <TerminalIcon size={14} /> …or push an existing local project
                            </h4>
                            <button
                                onClick={() => copyToClipboard(existingRepoSnippet, "existingRepo")}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "12px",
                                    padding: "3px 8px",
                                    borderRadius: "4px",
                                    border: "1px solid var(--color-border-default)",
                                    backgroundColor: "var(--color-canvas-subtle)",
                                    color: "var(--color-fg-default)",
                                    cursor: "pointer",
                                }}
                            >
                                {copiedSnippet === "existingRepo" ? <CheckIcon size={12} fill="var(--color-success-fg)" /> : <CopyIcon size={12} />}
                                {copiedSnippet === "existingRepo" ? "Copied" : "Copy"}
                            </button>
                        </div>

                        <pre
                            style={{
                                backgroundColor: "var(--color-canvas-subtle)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "6px",
                                padding: "12px 16px",
                                fontSize: "12px",
                                lineHeight: "1.6",
                                fontFamily: "monospace",
                                color: "var(--color-fg-default)",
                                overflowX: "auto",
                                margin: 0,
                            }}
                        >
                            {existingRepoSnippet}
                        </pre>
                    </div>

                    {/* Snippet 3: Pull repository to another machine */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <h4 style={{ fontSize: "14px", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                                <TerminalIcon size={14} /> …or pull repository to another computer
                            </h4>
                            <button
                                onClick={() => copyToClipboard(pullRepoSnippet, "pullRepo")}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "12px",
                                    padding: "3px 8px",
                                    borderRadius: "4px",
                                    border: "1px solid var(--color-border-default)",
                                    backgroundColor: "var(--color-canvas-subtle)",
                                    color: "var(--color-fg-default)",
                                    cursor: "pointer",
                                }}
                            >
                                {copiedSnippet === "pullRepo" ? <CheckIcon size={12} fill="var(--color-success-fg)" /> : <CopyIcon size={12} />}
                                {copiedSnippet === "pullRepo" ? "Copied" : "Copy"}
                            </button>
                        </div>

                        <pre
                            style={{
                                backgroundColor: "var(--color-canvas-subtle)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "6px",
                                padding: "12px 16px",
                                fontSize: "12px",
                                lineHeight: "1.6",
                                fontFamily: "monospace",
                                color: "var(--color-fg-default)",
                                overflowX: "auto",
                                margin: 0,
                            }}
                        >
                            {pullRepoSnippet}
                        </pre>
                    </div>

                    {/* Pro-tip */}
                    <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--color-border-muted)", fontSize: "13px", color: "var(--color-fg-muted)" }}>
                        <FileCodeIcon size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                        Prefer working directly in the browser? You can start by{" "}
                        <Link to={`${basePath}/edit/${branch}/README.md`} style={{ color: "var(--color-accent-fg)" }}>
                            creating a README file online
                        </Link>.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickSetup;
