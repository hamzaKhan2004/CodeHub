import { useState, useEffect } from "react";
import { Link } from "react-router";
import repoService from "../services/repoService";
import AppLayout from "../layouts/AppLayout";
import { RepoIcon, StarIcon, FlameIcon, SearchIcon } from "@primer/octicons-react";

export const ExplorePage = () => {
    const [repositories, setRepositories] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRepos = async () => {
            setLoading(true);
            try {
                const data = await repoService.getAllRepositories({ search, limit: 30 });
                setRepositories(data.repositories || []);
            } catch (err) {
                console.error("Explore load error:", err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            loadRepos();
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    return (
        <AppLayout>
            <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "32px 24px", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
                    <div>
                        <h1 style={{ fontSize: "24px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                            <FlameIcon size={24} fill="var(--color-attention-fg)" />
                            Explore CodeHub
                        </h1>
                        <p style={{ color: "var(--color-fg-muted)", fontSize: "14px", marginTop: "6px", margin: 0 }}>
                            Discover public repositories and open source projects.
                        </p>
                    </div>

                    <div style={{ position: "relative", minWidth: "280px" }}>
                        <input
                            type="text"
                            placeholder="Filter repositories..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "6px 12px 6px 32px",
                                backgroundColor: "var(--color-canvas-default)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "6px",
                                color: "var(--color-fg-default)",
                                fontSize: "13px",
                                outline: "none",
                            }}
                        />
                        <span style={{ position: "absolute", left: "10px", top: "7px", color: "var(--color-fg-muted)" }}>
                            <SearchIcon size={16} />
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: "48px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                        Loading public repositories...
                    </div>
                ) : repositories.length === 0 ? (
                    <div style={{ padding: "48px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                        No repositories found matching your search.
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {repositories.map((repo) => {
                            const ownerName = repo.owner?.username || "user";
                            return (
                                <div
                                    key={repo._id}
                                    style={{
                                        border: "1px solid var(--color-border-default)",
                                        borderRadius: "6px",
                                        padding: "20px",
                                        backgroundColor: "var(--color-canvas-default)",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <RepoIcon size={18} fill="var(--color-fg-muted)" />
                                            <Link
                                                to={`/${ownerName}/${repo.name}`}
                                                style={{ fontSize: "16px", fontWeight: 600 }}
                                            >
                                                {ownerName} / {repo.name}
                                            </Link>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "var(--color-fg-muted)" }}>
                                            <StarIcon size={14} />
                                            <span>{repo.starsCount || 0}</span>
                                        </div>
                                    </div>

                                    {repo.description && (
                                        <p style={{ color: "var(--color-fg-muted)", fontSize: "14px", margin: "10px 0 0" }}>
                                            {repo.description}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default ExplorePage;
