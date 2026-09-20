/**
 * Diff Line Parser (Layer 4)
 * Generates unified line-by-line diff structures for Pull Requests and Commits.
 */

export const parseDiffLines = (oldContent = "", newContent = "") => {
    const oldLines = oldContent ? oldContent.split("\n") : [];
    const newLines = newContent ? newContent.split("\n") : [];

    const lines = [];
    const maxLen = Math.max(oldLines.length, newLines.length);

    // Simple line-by-line comparison
    for (let i = 0; i < maxLen; i++) {
        const oldLine = oldLines[i];
        const newLine = newLines[i];

        if (oldLine === undefined && newLine !== undefined) {
            lines.push({ type: "added", content: newLine, lineNum: i + 1 });
        } else if (oldLine !== undefined && newLine === undefined) {
            lines.push({ type: "deleted", content: oldLine, lineNum: i + 1 });
        } else if (oldLine !== newLine) {
            lines.push({ type: "deleted", content: oldLine, lineNum: i + 1 });
            lines.push({ type: "added", content: newLine, lineNum: i + 1 });
        } else {
            lines.push({ type: "normal", content: oldLine, lineNum: i + 1 });
        }
    }

    return lines;
};
