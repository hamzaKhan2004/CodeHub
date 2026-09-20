/**
 * Language Detector & Color Mapper (Layer 4)
 */

export const getLanguageFromFilename = (filename = "") => {
    const ext = filename.split(".").pop().toLowerCase();

    const map = {
        js: { name: "JavaScript", color: "#f1e05a" },
        jsx: { name: "JavaScript (JSX)", color: "#f1e05a" },
        ts: { name: "TypeScript", color: "#3178c6" },
        tsx: { name: "TypeScript (TSX)", color: "#3178c6" },
        py: { name: "Python", color: "#3572A5" },
        html: { name: "HTML", color: "#e34c26" },
        css: { name: "CSS", color: "#563d7c" },
        json: { name: "JSON", color: "#292929" },
        md: { name: "Markdown", color: "#083fa1" },
        java: { name: "Java", color: "#b07219" },
        cpp: { name: "C++", color: "#f34b7d" },
        c: { name: "C", color: "#555555" },
        go: { name: "Go", color: "#00ADD8" },
        rs: { name: "Rust", color: "#dea584" },
        php: { name: "PHP", color: "#4F5D95" },
        rb: { name: "Ruby", color: "#701516" },
        sh: { name: "Shell", color: "#89e051" },
        sql: { name: "SQL", color: "#e38c00" },
        yaml: { name: "YAML", color: "#cb171e" },
        yml: { name: "YAML", color: "#cb171e" },
    };

    return map[ext] || { name: "Plain Text", color: "#8b949e" };
};
