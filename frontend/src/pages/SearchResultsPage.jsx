import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router";
import searchService from "../services/searchService";
import AppLayout from "../layouts/AppLayout";
import {
    RepoIcon,
    PersonIcon,
    IssueOpenedIcon,
    GitPullRequestIcon,
    SearchIcon,
} from "@primer/octicons-react";

export const SearchResultsPage = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get("q") || "";

    const [activeType, setActiveType] = useState("repositories"); // "repositories" | "users" | "issues" | "pullRequests"
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const performSearch = async () => {
            if (!query.trim()) {
                setResults(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const data = await searchService.search(query, activeType);
                setResults(data);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setLoading(false);
            }
        };

        performSearch();
    }, [query, activeType]);

    const counts = results?.counts || { repositories: 0, users: 0, issues: 0, pullRequests: 0 };

    return (
        <AppLayout>
            <div
                style={{
                    maxWidth: "1280px",
                    margin: "0 auto",
                    padding: "32px 24px",
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "240px 1fr",
                    gap: "32px",
                }}
            >
                {/* Left Sidebar: Categories */}
                <aside style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-fg-muted)", marginBottom: "8px", padding: "0 8px" }}>
                        Search Filter
                    </h3>

                    <button
                        onClick={() => setActiveType("repositories")}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            background: activeType === "repositories" ? "var(--color-border-muted)" : "transparent",
                            border: "none",
                            color: "var(--color-fg-default)",
                            fontWeight: activeType === "repositories" ? 600 : 400,
                            fontSize: "13px",
                        }}
                    >
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <RepoIcon size={16} /> Repositories
                        </span>
                        <span style={{ fontSize: "11px", backgroundColor: "var(--color-canvas-default)", padding: "1px 6px", borderRadius: "10px" }}>
                            {counts.repositories || 0}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveType("users")}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            background: activeType === "users" ? "var(--color-border-muted)" : "transparent",
                            border: "none",
                            color: "var(--color-fg-default)",
                            fontWeight: activeType === "users" ? 600 : 400,
                            fontSize: "13px",
                        }}
                    >
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <PersonIcon size={16} /> Users
                        </span>
                        <span style={{ fontSize: "11px", backgroundColor: "var(--color-canvas-default)", padding: "1px 6px", borderRadius: "10px" }}>
                            {counts.users || 0}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveType("issues")}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            background: activeType === "issues" ? "var(--color-border-muted)" : "transparent",
                            border: "none",
                            color: "var(--color-fg-default)",
                            fontWeight: activeType === "issues" ? 600 : 400,
                            fontSize: "13px",
                        }}
                    >
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <IssueOpenedIcon size={16} /> Issues
                        </span>
                        <span style={{ fontSize: "11px", backgroundColor: "var(--color-canvas-default)", padding: "1px 6px", borderRadius: "10px" }}>
                            {counts.issues || 0}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveType("pullRequests")}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            background: activeType === "pullRequests" ? "var(--color-border-muted)" : "transparent",
                            border: "none",
                            color: "var(--color-fg-default)",
                            fontWeight: activeType === "pullRequests" ? 600 : 400,
                            fontSize: "13px",
                        }}
                    >
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <GitPullRequestIcon size={16} /> Pull requests
                        </span>
                        <span style={{ fontSize: "11px", backgroundColor: "var(--color-canvas-default)", padding: "1px 6px", borderRadius: "10px" }}>
                            {counts.pullRequests || 0}
                        </span>
                    </button>
                </aside>

                {/* Right Column: Search Results */}
                <main>
                    <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px" }}>
                        {loading ? "Searching..." : `${counts[activeType] || 0} ${activeType} results for "${query}"`}
                    </h2>

                    {loading ? (
                        <div style={{ padding: "40px", color: "var(--color-fg-muted)" }}>Searching...</div>
                    ) : !query.trim() ? (
                        <div style={{ padding: "40px", color: "var(--color-fg-muted)" }}>
                            Enter a search query in the search bar above.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {/* Repositories */}
                            {activeType === "repositories" &&
                                (results?.repositories?.length === 0 ? (
                                    <div style={{ padding: "40px", color: "var(--color-fg-muted)" }}>No repositories found.</div>
                                ) : (
                                    results?.repositories?.map((repo) => {
                                        const ownerName = repo.owner?.username || "user";
                                        return (
                                            <div
                                                key={repo._id}
                                                style={{
                                                    border: "1px solid var(--color-border-default)",
                                                    borderRadius: "6px",
                                                    padding: "16px",
                                                    backgroundColor: "var(--color-canvas-default)",
                                                }}
                                            >
                                                <Link to={`/${ownerName}/${repo.name}`} style={{ fontSize: "16px", fontWeight: 600 }}>
                                                    {ownerName}/{repo.name}
                                                </Link>
                                                {repo.description && (
                                                    <p style={{ color: "var(--color-fg-muted)", fontSize: "13px", margin: "6px 0 0" }}>
                                                        {repo.description}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })
                                ))}

                            {/* Users */}
                            {activeType === "users" &&
                                (results?.users?.length === 0 ? (
                                    <div style={{ padding: "40px", color: "var(--color-fg-muted)" }}>No users found.</div>
                                ) : (
                                    results?.users?.map((u) => (
                                        <div
                                            key={u._id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                padding: "16px",
                                                border: "1px solid var(--color-border-default)",
                                                borderRadius: "6px",
                                                backgroundColor: "var(--color-canvas-default)",
                                            }}
                                        >
                                            <img
                                                src={u.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`}
                                                alt={u.username}
                                                style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                                            />
                                            <div>
                                                <Link to={`/${u.username}`} style={{ fontSize: "15px", fontWeight: 600 }}>
                                                    {u.name || u.username}
                                                </Link>
                                                <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
                                                    @{u.username}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ))}

                            {/* Issues */}
                            {activeType === "issues" &&
                                (results?.issues?.length === 0 ? (
                                    <div style={{ padding: "40px", color: "var(--color-fg-muted)" }}>No issues found.</div>
                                ) : (
                                    results?.issues?.map((issue) => (
                                        <div
                                            key={issue._id}
                                            style={{
                                                padding: "16px",
                                                border: "1px solid var(--color-border-default)",
                                                borderRadius: "6px",
                                                backgroundColor: "var(--color-canvas-default)",
                                            }}
                                        >
                                            <Link
                                                to={`/${issue.repository?.owner?.username || "user"}/${issue.repository?.name}/issues/${issue.issueNumber}`}
                                                style={{ fontSize: "15px", fontWeight: 600 }}
                                            >
                                                {issue.title}
                                            </Link>
                                            <div style={{ fontSize: "12px", color: "var(--color-fg-muted)", marginTop: "4px" }}>
                                                in {issue.repository?.name} • opened by {issue.author?.username}
                                            </div>
                                        </div>
                                    ))
                                ))}

                            {/* Pull Requests */}
                            {activeType === "pullRequests" &&
                                (results?.pullRequests?.length === 0 ? (
                                    <div style={{ padding: "40px", color: "var(--color-fg-muted)" }}>No pull requests found.</div>
                                ) : (
                                    results?.pullRequests?.map((pr) => (
                                        <div
                                            key={pr._id}
                                            style={{
                                                padding: "16px",
                                                border: "1px solid var(--color-border-default)",
                                                borderRadius: "6px",
                                                backgroundColor: "var(--color-canvas-default)",
                                            }}
                                        >
                                            <Link
                                                to={`/${pr.repository?.owner?.username || "user"}/${pr.repository?.name}/pulls/${pr.number}`}
                                                style={{ fontSize: "15px", fontWeight: 600 }}
                                            >
                                                {pr.title}
                                            </Link>
                                            <div style={{ fontSize: "12px", color: "var(--color-fg-muted)", marginTop: "4px" }}>
                                                in {pr.repository?.name} • #{pr.number}
                                            </div>
                                        </div>
                                    ))
                                ))}
                        </div>
                    )}
                </main>
            </div>
        </AppLayout>
    );
};

export default SearchResultsPage;
