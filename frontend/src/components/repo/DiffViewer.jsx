import { parseDiffLines } from "../../core/utils/diffParser";
import { FileDiffIcon } from "@primer/octicons-react";

export const DiffViewer = ({ diffs = [] }) => {
    if (!diffs || diffs.length === 0) {
        return (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                No file changes to display.
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {diffs.map((fileDiff, fileIdx) => {
                const lines = parseDiffLines(fileDiff.oldContent || "", fileDiff.newContent || "");
                const isAdded = fileDiff.status === "added";
                const isDeleted = fileDiff.status === "deleted";

                return (
                    <div
                        key={fileDiff.path || fileIdx}
                        style={{
                            border: "1px solid var(--color-border-default)",
                            borderRadius: "6px",
                            overflow: "hidden",
                            backgroundColor: "var(--color-canvas-default)",
                        }}
                    >
                        {/* File Diff Header */}
                        <div
                            style={{
                                backgroundColor: "var(--color-canvas-subtle)",
                                padding: "8px 16px",
                                borderBottom: "1px solid var(--color-border-default)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                fontSize: "13px",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <FileDiffIcon size={16} />
                                <strong style={{ color: "var(--color-fg-default)" }}>{fileDiff.path}</strong>
                                <span
                                    style={{
                                        fontSize: "11px",
                                        padding: "1px 6px",
                                        borderRadius: "10px",
                                        backgroundColor: isAdded
                                            ? "var(--color-diff-add-bg)"
                                            : isDeleted
                                            ? "var(--color-diff-del-bg)"
                                            : "var(--color-border-default)",
                                        color: isAdded
                                            ? "var(--color-diff-add-fg)"
                                            : isDeleted
                                            ? "var(--color-diff-del-fg)"
                                            : "var(--color-fg-default)",
                                        textTransform: "uppercase",
                                        fontWeight: 600,
                                    }}
                                >
                                    {fileDiff.status}
                                </span>
                            </div>

                            <div style={{ display: "flex", gap: "10px", fontSize: "12px", fontFamily: "monospace" }}>
                                <span style={{ color: "var(--color-diff-add-fg)" }}>+{fileDiff.additions || 0}</span>
                                <span style={{ color: "var(--color-diff-del-fg)" }}>-{fileDiff.deletions || 0}</span>
                            </div>
                        </div>

                        {/* Diff Lines Table */}
                        <div style={{ overflowX: "auto", fontFamily: "monospace", fontSize: "12px", lineHeight: "20px" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <tbody>
                                    {lines.map((line, lineIdx) => {
                                        let bg = "transparent";
                                        let sign = " ";
                                        let textColor = "var(--color-fg-default)";

                                        if (line.type === "added") {
                                            bg = "var(--color-diff-add-bg)";
                                            sign = "+";
                                            textColor = "var(--color-diff-add-fg)";
                                        } else if (line.type === "deleted") {
                                            bg = "var(--color-diff-del-bg)";
                                            sign = "-";
                                            textColor = "var(--color-diff-del-fg)";
                                        }

                                        return (
                                            <tr key={lineIdx} style={{ backgroundColor: bg, verticalAlign: "top" }}>
                                                <td
                                                    style={{
                                                        width: "40px",
                                                        padding: "0 8px",
                                                        textAlign: "right",
                                                        color: "var(--color-fg-subtle)",
                                                        userSelect: "none",
                                                        borderRight: "1px solid var(--color-border-muted)",
                                                    }}
                                                >
                                                    {line.lineNum}
                                                </td>
                                                <td
                                                    style={{
                                                        width: "20px",
                                                        textAlign: "center",
                                                        color: textColor,
                                                        fontWeight: "bold",
                                                        userSelect: "none",
                                                    }}
                                                >
                                                    {sign}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "0 12px",
                                                        whiteSpace: "pre-wrap",
                                                        wordBreak: "break-all",
                                                        color: textColor,
                                                    }}
                                                >
                                                    {line.content || "\u00A0"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DiffViewer;
