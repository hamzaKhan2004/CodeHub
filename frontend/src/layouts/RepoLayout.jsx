import { useState } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router";
import { useRepo } from "../hooks/useRepo";
import { useAuth } from "../hooks/useAuth";
import AppLayout from "./AppLayout";
import {
    RepoIcon,
    CodeIcon,
    IssueOpenedIcon,
    GitPullRequestIcon,
    GearIcon,
    StarIcon,
    StarFillIcon,
    EyeIcon,
    RepoForkedIcon,
    LockIcon,
} from "@primer/octicons-react";

export const RepoLayout = ({ children }) => {
    const { owner, repo: repoName } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { repo, loading, error, toggleStar } = useRepo(owner, repoName);
    const [starring, setStarring] = useState(false);

    const handleStar = async () => {
        if (!currentUser) {
            navigate("/login");
            return;
        }
        setStarring(true);
        try {
            await toggleStar();
        } catch (err) {
            console.error("Failed to toggle star:", err);
        } finally {
            setStarring(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px", width: "100%" }}>
                    <div style={{ height: "40px", backgroundColor: "var(--color-border-muted)", borderRadius: "6px", marginBottom: "20px" }} />
                    <div style={{ height: "300px", backgroundColor: "var(--color-border-muted)", borderRadius: "6px" }} />
                </div>
            </AppLayout>
        );
    }

    if (error || !repo) {
        return (
            <AppLayout>
                <div style={{ maxWidth: "800px", margin: "60px auto", textAlign: "center", padding: "24px" }}>
                    <h2 style={{ fontSize: "24px", marginBottom: "8px" }}>Repository not found</h2>
                    <p style={{ color: "var(--color-fg-muted)", marginBottom: "20px" }}>
                        {error || "The repository you are looking for does not exist or is private."}
                    </p>
                    <Link
                        to="/"
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "var(--color-accent-emphasis)",
                            color: "white",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontWeight: 500,
                        }}
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </AppLayout>
        );
    }

    const basePath = `/${owner}/${repoName}`;
    const currentTab = location.pathname.startsWith(`${basePath}/issues`)
        ? "issues"
        : location.pathname.startsWith(`${basePath}/pulls`)
        ? "pulls"
        : location.pathname.startsWith(`${basePath}/settings`)
        ? "settings"
        : "code";

    const isOwner = currentUser && (repo.owner?._id === currentUser.id || repo.owner?.username === currentUser.username);

    return (
        <AppLayout>
            <div style={{ backgroundColor: "var(--color-canvas-subtle)", borderBottom: "1px solid var(--color-border-default)", paddingTop: "16px" }}>
                <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
                    {/* Repo Title & Action Buttons Header */}
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
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "18px" }}>
                            <RepoIcon size={20} className="text-muted" />
                            <Link to={`/${owner}`} style={{ color: "var(--color-accent-fg)" }}>
                                {owner}
                            </Link>
                            <span style={{ color: "var(--color-fg-muted)" }}>/</span>
                            <Link to={basePath} style={{ color: "var(--color-accent-fg)", fontWeight: 600 }}>
                                {repoName}
                            </Link>
                            <span
                                style={{
                                    fontSize: "12px",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    border: "1px solid var(--color-border-default)",
                                    color: "var(--color-fg-muted)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                {repo.isPrivate || repo.visibility === false ? (
                                    <>
                                        <LockIcon size={12} /> Private
                                    </>
                                ) : (
                                    "Public"
                                )}
                            </span>
                        </div>

                        {/* Top Action Buttons: Watch, Fork, Star */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "4px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--color-border-default)",
                                    backgroundColor: "var(--color-canvas-default)",
                                    color: "var(--color-fg-default)",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                }}
                            >
                                <EyeIcon size={14} />
                                <span>Watch</span>
                                <span style={{ backgroundColor: "var(--color-border-muted)", padding: "1px 6px", borderRadius: "10px", fontSize: "11px" }}>
                                    {repo.watchersCount || 1}
                                </span>
                            </button>

                            <button
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "4px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--color-border-default)",
                                    backgroundColor: "var(--color-canvas-default)",
                                    color: "var(--color-fg-default)",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                }}
                            >
                                <RepoForkedIcon size={14} />
                                <span>Fork</span>
                                <span style={{ backgroundColor: "var(--color-border-muted)", padding: "1px 6px", borderRadius: "10px", fontSize: "11px" }}>
                                    {repo.forksCount || 0}
                                </span>
                            </button>

                            <button
                                onClick={handleStar}
                                disabled={starring}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "4px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--color-border-default)",
                                    backgroundColor: repo.isStarred ? "var(--color-border-muted)" : "var(--color-canvas-default)",
                                    color: repo.isStarred ? "var(--color-attention-fg)" : "var(--color-fg-default)",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                }}
                            >
                                {repo.isStarred ? <StarFillIcon size={14} /> : <StarIcon size={14} />}
                                <span>{repo.isStarred ? "Starred" : "Star"}</span>
                                <span style={{ backgroundColor: "var(--color-border-default)", padding: "1px 6px", borderRadius: "10px", fontSize: "11px" }}>
                                    {repo.starsCount || 0}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Subnavigation Tabs */}
                    <nav style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
                        <Link
                            to={basePath}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 12px",
                                textDecoration: "none",
                                fontSize: "14px",
                                fontWeight: currentTab === "code" ? 600 : 400,
                                color: currentTab === "code" ? "var(--color-fg-default)" : "var(--color-fg-muted)",
                                borderBottom: currentTab === "code" ? "2px solid #fd8c73" : "2px solid transparent",
                            }}
                        >
                            <CodeIcon size={16} />
                            <span>Code</span>
                        </Link>

                        <Link
                            to={`${basePath}/issues`}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 12px",
                                textDecoration: "none",
                                fontSize: "14px",
                                fontWeight: currentTab === "issues" ? 600 : 400,
                                color: currentTab === "issues" ? "var(--color-fg-default)" : "var(--color-fg-muted)",
                                borderBottom: currentTab === "issues" ? "2px solid #fd8c73" : "2px solid transparent",
                            }}
                        >
                            <IssueOpenedIcon size={16} />
                            <span>Issues</span>
                            {repo.issues?.length > 0 && (
                                <span style={{ backgroundColor: "var(--color-border-default)", padding: "1px 6px", borderRadius: "10px", fontSize: "11px" }}>
                                    {repo.issues.length}
                                </span>
                            )}
                        </Link>

                        <Link
                            to={`${basePath}/pulls`}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 12px",
                                textDecoration: "none",
                                fontSize: "14px",
                                fontWeight: currentTab === "pulls" ? 600 : 400,
                                color: currentTab === "pulls" ? "var(--color-fg-default)" : "var(--color-fg-muted)",
                                borderBottom: currentTab === "pulls" ? "2px solid #fd8c73" : "2px solid transparent",
                            }}
                        >
                            <GitPullRequestIcon size={16} />
                            <span>Pull requests</span>
                        </Link>

                        {isOwner && (
                            <Link
                                to={`${basePath}/settings`}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 12px",
                                    textDecoration: "none",
                                    fontSize: "14px",
                                    fontWeight: currentTab === "settings" ? 600 : 400,
                                    color: currentTab === "settings" ? "var(--color-fg-default)" : "var(--color-fg-muted)",
                                    borderBottom: currentTab === "settings" ? "2px solid #fd8c73" : "2px solid transparent",
                                }}
                            >
                                <GearIcon size={16} />
                                <span>Settings</span>
                            </Link>
                        )}
                    </nav>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px", width: "100%", flex: 1 }}>
                {children}
            </div>
        </AppLayout>
    );
};

export default RepoLayout;
