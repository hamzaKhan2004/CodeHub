import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import userService from "../services/userService";
import AppLayout from "../layouts/AppLayout";
import HeatMap from "@uiw/react-heat-map";
import {
    RepoIcon,
    StarIcon,
    LocationIcon,
    LinkIcon,
    OrganizationIcon,
    PeopleIcon,
} from "@primer/octicons-react";

export const UserProfilePage = () => {
    const { username } = useParams();
    const { currentUser } = useAuth();

    const [profileData, setProfileData] = useState(null);
    const [activity, setActivity] = useState({ activityData: [], totalContributions: 0 });
    const [activeTab, setActiveTab] = useState("overview"); // "overview" | "repositories" | "stars"
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState(false);
    const [repoSearch, setRepoSearch] = useState("");

    const fetchProfile = useCallback(async () => {
        if (!username) return;
        setLoading(true);
        try {
            const data = await userService.getUserProfile(username);
            setProfileData(data);
            setFollowing(data.user?.isFollowing || false);

            if (data.user?.id || data.user?._id) {
                const actData = await userService.getUserActivity(data.user.id || data.user._id);
                setActivity(actData);
            }
        } catch (err) {
            console.error("Failed to load user profile:", err);
        } finally {
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleFollowToggle = async () => {
        if (!profileData?.user) return;
        const targetId = profileData.user.id || profileData.user._id;
        try {
            if (following) {
                await userService.unfollowUser(targetId);
                setFollowing(false);
                setProfileData((prev) => ({
                    ...prev,
                    user: { ...prev.user, followersCount: Math.max(0, prev.user.followersCount - 1) },
                }));
            } else {
                await userService.followUser(targetId);
                setFollowing(true);
                setProfileData((prev) => ({
                    ...prev,
                    user: { ...prev.user, followersCount: prev.user.followersCount + 1 },
                }));
            }
        } catch (err) {
            alert(err.message || "Failed to update follow status.");
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" }}>
                    Loading profile...
                </div>
            </AppLayout>
        );
    }

    if (!profileData || !profileData.user) {
        return (
            <AppLayout>
                <div style={{ maxWidth: "800px", margin: "60px auto", textAlign: "center" }}>
                    <h2>User not found</h2>
                    <p style={{ color: "var(--color-fg-muted)", margin: "8px 0 16px" }}>
                        The user <strong>@{username}</strong> does not exist on CodeHub.
                    </p>
                    <Link to="/">Go to Dashboard</Link>
                </div>
            </AppLayout>
        );
    }

    const user = profileData.user;
    const isSelf = currentUser && (currentUser.username === user.username || currentUser.id === user.id);

    const filteredRepos = (profileData.repositories || []).filter((r) =>
        r.name.toLowerCase().includes(repoSearch.toLowerCase())
    );

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    return (
        <AppLayout>
            <div
                style={{
                    maxWidth: "1280px",
                    margin: "0 auto",
                    padding: "32px 24px",
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "296px 1fr",
                    gap: "32px",
                }}
            >
                {/* Left Profile Sidebar */}
                <aside style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ position: "relative" }}>
                        <img
                            src={user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`}
                            alt={user.username}
                            style={{
                                width: "260px",
                                height: "260px",
                                borderRadius: "50%",
                                border: "1px solid var(--color-border-default)",
                                objectFit: "cover",
                            }}
                        />
                    </div>

                    <div>
                        <h1 style={{ fontSize: "24px", fontWeight: 600, margin: 0 }}>{user.name || user.username}</h1>
                        <div style={{ fontSize: "18px", color: "var(--color-fg-muted)", fontWeight: 300 }}>
                            {user.username}
                        </div>
                    </div>

                    {user.bio && (
                        <p style={{ fontSize: "14px", color: "var(--color-fg-default)", margin: 0, lineHeight: 1.5 }}>
                            {user.bio}
                        </p>
                    )}

                    {!isSelf ? (
                        <button
                            onClick={handleFollowToggle}
                            style={{
                                width: "100%",
                                padding: "6px 16px",
                                borderRadius: "6px",
                                border: "1px solid var(--color-border-default)",
                                backgroundColor: following ? "var(--color-canvas-default)" : "var(--color-border-muted)",
                                color: "var(--color-fg-default)",
                                fontWeight: 600,
                                fontSize: "14px",
                            }}
                        >
                            {following ? "Unfollow" : "Follow"}
                        </button>
                    ) : (
                        <Link
                            to="/settings"
                            style={{
                                width: "100%",
                                textAlign: "center",
                                padding: "6px 16px",
                                borderRadius: "6px",
                                border: "1px solid var(--color-border-default)",
                                backgroundColor: "var(--color-canvas-subtle)",
                                color: "var(--color-fg-default)",
                                fontWeight: 500,
                                fontSize: "14px",
                                textDecoration: "none",
                            }}
                        >
                            Edit profile
                        </Link>
                    )}

                    {/* Social Stats: Followers / Following */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "var(--color-fg-muted)" }}>
                        <PeopleIcon size={16} />
                        <span>
                            <strong style={{ color: "var(--color-fg-default)" }}>{user.followersCount || 0}</strong>{" "}
                            followers
                        </span>
                        <span>•</span>
                        <span>
                            <strong style={{ color: "var(--color-fg-default)" }}>{user.followingCount || 0}</strong>{" "}
                            following
                        </span>
                    </div>

                    {/* Meta information */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "var(--color-fg-muted)", marginTop: "8px" }}>
                        {user.company && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <OrganizationIcon size={14} /> <span>{user.company}</span>
                            </div>
                        )}
                        {user.location && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <LocationIcon size={14} /> <span>{user.location}</span>
                            </div>
                        )}
                        {user.website && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <LinkIcon size={14} />{" "}
                                <a href={user.website} target="_blank" rel="noreferrer" style={{ color: "var(--color-accent-fg)" }}>
                                    {user.website}
                                </a>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Right Main Content Area */}
                <main>
                    {/* Profile Subnav Tabs */}
                    <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid var(--color-border-default)", marginBottom: "24px" }}>
                        <button
                            onClick={() => setActiveTab("overview")}
                            style={{
                                padding: "8px 16px",
                                background: "transparent",
                                border: "none",
                                borderBottom: activeTab === "overview" ? "2px solid #fd8c73" : "2px solid transparent",
                                color: activeTab === "overview" ? "var(--color-fg-default)" : "var(--color-fg-muted)",
                                fontWeight: activeTab === "overview" ? 600 : 400,
                                fontSize: "14px",
                            }}
                        >
                            Overview
                        </button>

                        <button
                            onClick={() => setActiveTab("repositories")}
                            style={{
                                padding: "8px 16px",
                                background: "transparent",
                                border: "none",
                                borderBottom: activeTab === "repositories" ? "2px solid #fd8c73" : "2px solid transparent",
                                color: activeTab === "repositories" ? "var(--color-fg-default)" : "var(--color-fg-muted)",
                                fontWeight: activeTab === "repositories" ? 600 : 400,
                                fontSize: "14px",
                            }}
                        >
                            Repositories ({profileData.repositories?.length || 0})
                        </button>

                        <button
                            onClick={() => setActiveTab("stars")}
                            style={{
                                padding: "8px 16px",
                                background: "transparent",
                                border: "none",
                                borderBottom: activeTab === "stars" ? "2px solid #fd8c73" : "2px solid transparent",
                                color: activeTab === "stars" ? "var(--color-fg-default)" : "var(--color-fg-muted)",
                                fontWeight: activeTab === "stars" ? 600 : 400,
                                fontSize: "14px",
                            }}
                        >
                            Stars ({profileData.starredRepositories?.length || 0})
                        </button>
                    </div>

                    {/* Overview Tab Content */}
                    {activeTab === "overview" && (
                        <div>
                            {/* Pinned / Popular Repositories Grid */}
                            <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px" }}>Popular repositories</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
                                {(profileData.repositories || []).slice(0, 6).map((repo) => (
                                    <div
                                        key={repo._id}
                                        style={{
                                            border: "1px solid var(--color-border-default)",
                                            borderRadius: "6px",
                                            padding: "16px",
                                            backgroundColor: "var(--color-canvas-default)",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                                <RepoIcon size={16} fill="var(--color-fg-muted)" />
                                                <Link to={`/${user.username}/${repo.name}`} style={{ fontWeight: 600, fontSize: "14px" }}>
                                                    {repo.name}
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
                                                    {repo.isPrivate || repo.visibility === false ? "Private" : "Public"}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: "12px", color: "var(--color-fg-muted)", margin: 0 }}>
                                                {repo.description || "No description provided."}
                                            </p>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "16px", fontSize: "12px", color: "var(--color-fg-muted)" }}>
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                <StarIcon size={14} /> {repo.starsCount || 0}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Live Contribution Heatmap */}
                            <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px" }}>
                                {activity.totalContributions} contributions in the last year
                            </h3>
                            <div
                                style={{
                                    border: "1px solid var(--color-border-default)",
                                    borderRadius: "6px",
                                    padding: "20px",
                                    backgroundColor: "var(--color-canvas-default)",
                                    overflowX: "auto",
                                }}
                            >
                                <HeatMap
                                    value={activity.activityData}
                                    startDate={startDate}
                                    weekLabels={["", "Mon", "", "Wed", "", "Fri", ""]}
                                    rectSize={12}
                                    space={3}
                                    rectProps={{ rx: 2.5 }}
                                    panelColors={{
                                        0: "var(--color-canvas-subtle)",
                                        1: "#0e4429",
                                        2: "#006d32",
                                        3: "#26a641",
                                        4: "#39d353",
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Repositories Tab Content */}
                    {activeTab === "repositories" && (
                        <div>
                            <input
                                type="text"
                                placeholder="Find a repository..."
                                value={repoSearch}
                                onChange={(e) => setRepoSearch(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--color-border-default)",
                                    backgroundColor: "var(--color-canvas-default)",
                                    color: "var(--color-fg-default)",
                                    fontSize: "14px",
                                    marginBottom: "20px",
                                }}
                            />

                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {filteredRepos.map((repo) => (
                                    <div
                                        key={repo._id}
                                        style={{
                                            padding: "20px 0",
                                            borderBottom: "1px solid var(--color-border-muted)",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <Link
                                                    to={`/${user.username}/${repo.name}`}
                                                    style={{ fontSize: "18px", fontWeight: 600 }}
                                                >
                                                    {repo.name}
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
                                                    {repo.isPrivate || repo.visibility === false ? "Private" : "Public"}
                                                </span>
                                            </div>
                                            {repo.description && (
                                                <p style={{ color: "var(--color-fg-muted)", fontSize: "13px", margin: "6px 0 0" }}>
                                                    {repo.description}
                                                </p>
                                            )}
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "var(--color-fg-muted)" }}>
                                            <StarIcon size={14} />
                                            <span>{repo.starsCount || 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stars Tab Content */}
                    {activeTab === "stars" && (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {(profileData.starredRepositories || []).length === 0 ? (
                                <div style={{ padding: "40px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                                    This user has not starred any repositories yet.
                                </div>
                            ) : (
                                profileData.starredRepositories.map((repo) => (
                                    <div
                                        key={repo._id}
                                        style={{
                                            padding: "20px 0",
                                            borderBottom: "1px solid var(--color-border-muted)",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <RepoIcon size={16} fill="var(--color-fg-muted)" />
                                            <Link to={`/repo/${repo._id}`} style={{ fontSize: "16px", fontWeight: 600 }}>
                                                {repo.name}
                                            </Link>
                                        </div>
                                        {repo.description && (
                                            <p style={{ color: "var(--color-fg-muted)", fontSize: "13px", margin: "6px 0 0" }}>
                                                {repo.description}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </main>
            </div>
        </AppLayout>
    );
};

export default UserProfilePage;
