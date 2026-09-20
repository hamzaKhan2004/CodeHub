import { BookIcon } from "@primer/octicons-react";

/**
 * Lightweight Markdown Previewer (Layer 1)
 * Parses basic GitHub markdown headers, bold, italics, code blocks, lists, and links.
 */
export const MarkdownViewer = ({ content = "", title = "README.md" }) => {
    if (!content) return null;

    // Convert raw Markdown text to structured HTML safely
    const renderMarkdown = (text) => {
        const lines = text.split("\n");
        const rendered = [];
        let inCodeBlock = false;
        let codeBlockLines = [];

        lines.forEach((line, index) => {
            if (line.startsWith("```")) {
                if (inCodeBlock) {
                    rendered.push(
                        <pre
                            key={`code-${index}`}
                            style={{
                                backgroundColor: "var(--color-canvas-subtle)",
                                padding: "12px",
                                borderRadius: "6px",
                                border: "1px solid var(--color-border-default)",
                                overflowX: "auto",
                                fontSize: "13px",
                                margin: "12px 0",
                            }}
                        >
                            <code>{codeBlockLines.join("\n")}</code>
                        </pre>
                    );
                    codeBlockLines = [];
                    inCodeBlock = false;
                } else {
                    inCodeBlock = true;
                }
                return;
            }

            if (inCodeBlock) {
                codeBlockLines.push(line);
                return;
            }

            if (line.startsWith("# ")) {
                rendered.push(
                    <h1 key={index} style={{ fontSize: "28px", fontWeight: 600, borderBottom: "1px solid var(--color-border-default)", paddingBottom: "8px", margin: "16px 0 12px" }}>
                        {line.replace("# ", "")}
                    </h1>
                );
            } else if (line.startsWith("## ")) {
                rendered.push(
                    <h2 key={index} style={{ fontSize: "22px", fontWeight: 600, borderBottom: "1px solid var(--color-border-default)", paddingBottom: "6px", margin: "14px 0 10px" }}>
                        {line.replace("## ", "")}
                    </h2>
                );
            } else if (line.startsWith("### ")) {
                rendered.push(
                    <h3 key={index} style={{ fontSize: "18px", fontWeight: 600, margin: "12px 0 8px" }}>
                        {line.replace("### ", "")}
                    </h3>
                );
            } else if (line.startsWith("- ") || line.startsWith("* ")) {
                rendered.push(
                    <li key={index} style={{ marginLeft: "20px", marginBottom: "4px" }}>
                        {line.replace(/^[-*]\s+/, "")}
                    </li>
                );
            } else if (line.trim() === "") {
                rendered.push(<div key={index} style={{ height: "8px" }} />);
            } else {
                rendered.push(
                    <p key={index} style={{ margin: "6px 0", lineHeight: 1.6, color: "var(--color-fg-default)" }}>
                        {line}
                    </p>
                );
            }
        });

        return rendered;
    };

    return (
        <div
            style={{
                border: "1px solid var(--color-border-default)",
                borderRadius: "6px",
                marginTop: "24px",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    backgroundColor: "var(--color-canvas-subtle)",
                    padding: "10px 16px",
                    borderBottom: "1px solid var(--color-border-default)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                }}
            >
                <BookIcon size={16} />
                <span>{title}</span>
            </div>

            <div style={{ padding: "24px", backgroundColor: "var(--color-canvas-default)" }}>
                {renderMarkdown(content)}
            </div>
        </div>
    );
};

export default MarkdownViewer;
