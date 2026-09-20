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
    FlameIcon,
} from "@primer/octicons-react";

export const Dashboard = () => {
    const { currentUser } = useAuth();
    const [userRepos, setUserRepos] = useState([]);
    const [exploreRepos, setExploreRepos] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                const [publicData, userData] = await Promise.all([
                    repoService.getAllRepositories({ limit: 10 }),
                    currentUser ? repoService.getUserRepositories(currentUser.id || currentUser._id) : Promise.resolve([]),
                ]);

                setExploreRepos(publicData.repositories || []);
                setUserRepos(userData || []);
            } catch (err) {
                console.error("Dashboard data load error:", err);
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
                    maxWidth: "1440px",
                    margin: "0 auto",
                    padding: "24px",
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "320px 1fr 280px",
                    gap: "24px",
                }}
            >
                {/* Left Column: User's Top Repositories */}
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
                        <h3 style={{ fontSize: "14px", fontWeight: 600 }}>Top Repositories</h3>
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

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {loading ? (
                            <div style={{ fontSize: "12px", color: "var(--color-fg-muted)", padding: "12px 0" }}>
                                Loading repositories...
                            </div>
                        ) : filteredUserRepos.length === 0 ? (
                            <div style={{ fontSize: "12px", color: "var(--color-fg-muted)", padding: "12px 0" }}>
                                {search ? "No matching repositories." : "You have not created any repositories yet."}
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

                {/* Center Column: Activity Feed & Trending Projects */}
                <main style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div
                        style={{
                            backgroundColor: "var(--color-canvas-subtle)",
                            border: "1px solid var(--color-border-default)",
                            borderRadius: "8px",
                            padding: "20px",
                        }}
                    >
                        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
                            Welcome to CodeHub
                        </h2>
                        <p style={{ color: "var(--color-fg-muted)", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
                            CodeHub is your developer platform for version control, collaborative code browsing,
                            issues, discussions, and pull requests.
                        </p>
                    </div>

                    <div
                        style={{
                            backgroundColor: "var(--color-canvas-subtle)",
                            border: "1px solid var(--color-border-default)",
                            borderRadius: "8px",
                            padding: "20px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                            <FlameIcon size={18} fill="var(--color-attention-fg)" />
                            <h3 style={{ fontSize: "16px", fontWeight: 600 }}>Explore Repositories</h3>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {exploreRepos.map((repo) => {
                                const ownerName = repo.owner?.username || "user";
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
                                                    style={{ fontSize: "15px", fontWeight: 600 }}
                                                >
                                                    {ownerName} / {repo.name}
                                                </Link>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--color-fg-muted)" }}>
                                                <StarIcon size={14} />
                                                <span>{repo.starsCount || 0}</span>
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
                </main>

                {/* Right Column: Quick Links & Resources */}
                <aside style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div
                        style={{
                            backgroundColor: "var(--color-canvas-subtle)",
                            border: "1px solid var(--color-border-default)",
                            borderRadius: "8px",
                            padding: "16px",
                        }}
                    >
                        <h4 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px" }}>Quick Shortcuts</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                            <Link to="/explore" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <BookIcon size={14} /> Explore public repositories
                            </Link>
                            <Link to="/new" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <PlusIcon size={14} /> Create a new repository
                            </Link>
                            {currentUser && (
                                <Link to={`/${currentUser.username}`} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <RepoIcon size={14} /> View your profile
                                </Link>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </AppLayout>
    );
};

export default Dashboard;
