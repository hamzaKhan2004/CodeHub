import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import repoService from "../services/repoService";
import AppLayout from "../layouts/AppLayout";
import {
    RepoIcon,
    PlusIcon,
    StarIcon,
    SearchIcon,
    BookIcon,
    LockIcon,
    GlobeIcon,
} from "@primer/octicons-react";
import { formatDate } from "../core/utils/dateFormatter";

export const Dashboard = () => {
    const { currentUser, isAuthenticated } = useAuth();
    const [userRepos, setUserRepos] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!currentUser) {
                setUserRepos([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const userId = currentUser.id || currentUser._id;
                const repos = await repoService.getUserRepositories(userId);
                setUserRepos(repos || []);
            } catch (err) {
                console.error("Dashboard data load error:", err);
                setUserRepos([]);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [currentUser]);

    const filteredUserRepos = userRepos.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AppLayout>
            <div
                style={{
                    maxWidth: "1280px",
                    margin: "0 auto",
                    padding: "24px",
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "300px 1fr",
                    gap: "24px",
                }}
            >
                {/* Left Column: Repositories List & Search */}
                <aside
                    style={{
                        backgroundColor: "var(--color-canvas-subtle)",
                        border: "1px solid var(--color-border-default)",
                        borderRadius: "8px",
                        padding: "16px",
                        height: "fit-content",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>Repositories</h3>
                        <Link
                            to="/new"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                backgroundColor: "var(--color-success-emphasis)",
                                color: "white",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                textDecoration: "none",
                            }}
                        >
                            <PlusIcon size={14} /> New
                        </Link>
                    </div>

                    <div style={{ position: "relative", marginBottom: "12px" }}>
                        <input
                            type="text"
                            placeholder="Find a repository..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "6px 8px 6px 28px",
                                fontSize: "12px",
                                backgroundColor: "var(--color-canvas-default)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "6px",
                                color: "var(--color-fg-default)",
                                outline: "none",
                            }}
                        />
                        <span style={{ position: "absolute", left: "8px", top: "7px", color: "var(--color-fg-muted)" }}>
                            <SearchIcon size={14} />
                        </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {loading ? (
                            <div style={{ fontSize: "12px", color: "var(--color-fg-muted)", padding: "12px 0" }}>
                                Loading repositories...
                            </div>
                        ) : filteredUserRepos.length === 0 ? (
                            <div style={{ fontSize: "12px", color: "var(--color-fg-muted)", padding: "12px 0" }}>
                                {search ? "No matching repositories." : "No repositories found."}
                            </div>
                        ) : (
                            filteredUserRepos.map((repo) => {
                                const ownerName = repo.owner?.username || currentUser?.username || "user";
                                return (
                                    <Link
                                        key={repo._id}
                                        to={`/${ownerName}/${repo.name}`}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            padding: "6px 8px",
                                            borderRadius: "6px",
                                            color: "var(--color-fg-default)",
                                            textDecoration: "none",
                                            fontSize: "13px",
                                            fontWeight: 500,
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-border-muted)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                    >
                                        <RepoIcon size={14} fill="var(--color-fg-muted)" />
                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {ownerName}/{repo.name}
                                        </span>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </aside>

                {/* Center / Main Feed */}
                <main style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div
                        style={{
                            backgroundColor: "var(--color-canvas-subtle)",
                            border: "1px solid var(--color-border-default)",
                            borderRadius: "8px",
                            padding: "20px",
                        }}
                    >
                        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px", margin: 0 }}>
                            Welcome to CodeHub
                        </h2>
                        <p style={{ color: "var(--color-fg-muted)", fontSize: "14px", lineHeight: "1.6", margin: "8px 0 0" }}>
                            Your reliable platform for Git repository hosting, commits, and code management.
                        </p>
                    </div>

                    {loading ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                            Loading your workspace...
                        </div>
                    ) : userRepos.length === 0 ? (
                        /* Empty State if user has 0 repositories */
                        <div
                            style={{
                                backgroundColor: "var(--color-canvas-subtle)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "8px",
                                padding: "48px 24px",
                                textAlign: "center",
                            }}
                        >
                            <RepoIcon size={40} className="text-muted" style={{ marginBottom: "16px" }} />
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px", margin: 0 }}>
                                You don't have any repositories yet.
                            </h3>
                            <p style={{ color: "var(--color-fg-muted)", fontSize: "14px", marginBottom: "20px", maxWidth: "440px", margin: "8px auto 20px" }}>
                                Get started by creating your first repository. You can push local code or start fresh with a README.
                            </p>
                            <Link
                                to="/new"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    backgroundColor: "var(--color-success-emphasis)",
                                    color: "white",
                                    padding: "8px 18px",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    textDecoration: "none",
                                }}
                            >
                                <PlusIcon size={16} /> Create repository
                            </Link>
                        </div>
                    ) : (
                        /* User's Repositories Feed */
                        <div
                            style={{
                                backgroundColor: "var(--color-canvas-subtle)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "8px",
                                padding: "20px",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                                <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>Your Repositories</h3>
                                <Link
                                    to="/new"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "13px",
                                        color: "var(--color-accent-fg)",
                                        textDecoration: "none",
                                        fontWeight: 500,
                                    }}
                                >
                                    <PlusIcon size={14} /> New repository
                                </Link>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {filteredUserRepos.map((repo) => {
                                    const ownerName = repo.owner?.username || currentUser?.username || "user";
                                    const isPrivate = repo.isPrivate || repo.visibility === false;

                                    return (
                                        <div
                                            key={repo._id}
                                            style={{
                                                border: "1px solid var(--color-border-muted)",
                                                borderRadius: "6px",
                                                padding: "16px",
                                                backgroundColor: "var(--color-canvas-default)",
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <RepoIcon size={16} fill="var(--color-fg-muted)" />
                                                    <Link
                                                        to={`/${ownerName}/${repo.name}`}
                                                        style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-accent-fg)", textDecoration: "none" }}
                                                    >
                                                        {ownerName} / {repo.name}
                                                    </Link>
                                                    <span
                                                        style={{
                                                            fontSize: "11px",
                                                            padding: "1px 6px",
                                                            borderRadius: "10px",
                                                            border: "1px solid var(--color-border-default)",
                                                            color: "var(--color-fg-muted)",
                                                        }}
                                                    >
                                                        {isPrivate ? "Private" : "Public"}
                                                    </span>
                                                </div>

                                                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--color-fg-muted)" }}>
                                                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                        <StarIcon size={14} />
                                                        {repo.starsCount || 0}
                                                    </span>
                                                    <span>Updated {formatDate(repo.updatedAt)}</span>
                                                </div>
                                            </div>

                                            {repo.description && (
                                                <p style={{ color: "var(--color-fg-muted)", fontSize: "13px", margin: "8px 0 0" }}>
                                                    {repo.description}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </AppLayout>
    );
};

export default Dashboard;
