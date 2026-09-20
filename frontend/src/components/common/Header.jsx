import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useNotifications } from "../../hooks/useNotifications";
import {
    MarkGithubIcon,
    SearchIcon,
    PlusIcon,
    BellIcon,
    MoonIcon,
    SunIcon,
    RepoIcon,
    SignOutIcon,
    PersonIcon,
    GearIcon,
} from "@primer/octicons-react";

export const Header = () => {
    const { currentUser, isAuthenticated, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();
    const location = useLocation();

    const [searchQuery, setSearchQuery] = useState("");
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [createDropdownOpen, setCreateDropdownOpen] = useState(false);

    const userMenuRef = useRef(null);
    const createMenuRef = useRef(null);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserDropdownOpen(false);
            }
            if (createMenuRef.current && !createMenuRef.current.contains(e.target)) {
                setCreateDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleLogout = () => {
        logout();
        setUserDropdownOpen(false);
        navigate("/login");
    };

    return (
        <header
            style={{
                backgroundColor: "var(--color-canvas-subtle)",
                borderBottom: "1px solid var(--color-border-default)",
                padding: "10px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                position: "sticky",
                top: 0,
                zIndex: 100,
            }}
        >
            {/* Left: Brand & Search */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, maxWidth: "600px" }}>
                <Link
                    to="/"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "var(--color-fg-default)",
                        textDecoration: "none",
                        fontWeight: 600,
                        fontSize: "16px",
                    }}
                >
                    <MarkGithubIcon size={32} />
                    <span>CodeHub</span>
                </Link>

                <form onSubmit={handleSearchSubmit} style={{ flex: 1, maxWidth: "340px", position: "relative" }}>
                    <input
                        type="text"
                        placeholder="Search CodeHub or jump to..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "6px 12px 6px 32px",
                            borderRadius: "6px",
                            backgroundColor: "var(--color-canvas-default)",
                            border: "1px solid var(--color-border-default)",
                            color: "var(--color-fg-default)",
                            fontSize: "13px",
                            outline: "none",
                        }}
                    />
                    <span style={{ position: "absolute", left: "10px", top: "7px", color: "var(--color-fg-muted)" }}>
                        <SearchIcon size={16} />
                    </span>
                </form>

                <nav style={{ display: "flex", gap: "12px" }}>
                    <Link
                        to="/explore"
                        style={{
                            color: location.pathname === "/explore" ? "var(--color-fg-default)" : "var(--color-fg-muted)",
                            fontWeight: 500,
                            fontSize: "13px",
                            textDecoration: "none",
                        }}
                    >
                        Explore
                    </Link>
                </nav>
            </div>

            {/* Right: Actions, Theme, Notifications & User Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                    style={{
                        background: "transparent",
                        border: "1px solid var(--color-border-default)",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        color: "var(--color-fg-default)",
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
                </button>

                {isAuthenticated ? (
                    <>
                        {/* Notifications Icon with Badge */}
                        <Link
                            to="/notifications"
                            title="Notifications"
                            style={{
                                position: "relative",
                                padding: "6px",
                                color: "var(--color-fg-default)",
                                display: "flex",
                                alignItems: "center",
                                textDecoration: "none",
                            }}
                        >
                            <BellIcon size={18} />
                            {unreadCount > 0 && (
                                <span
                                    style={{
                                        position: "absolute",
                                        top: "2px",
                                        right: "2px",
                                        backgroundColor: "var(--color-accent-emphasis)",
                                        color: "white",
                                        borderRadius: "50%",
                                        width: "14px",
                                        height: "14px",
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </Link>

                        {/* Create Menu Dropdown (+ Icon) */}
                        <div ref={createMenuRef} style={{ position: "relative" }}>
                            <button
                                onClick={() => setCreateDropdownOpen((prev) => !prev)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    background: "transparent",
                                    border: "1px solid var(--color-border-default)",
                                    borderRadius: "6px",
                                    padding: "5px 8px",
                                    color: "var(--color-fg-default)",
                                }}
                            >
                                <PlusIcon size={16} />
                                <span style={{ fontSize: "10px" }}>▼</span>
                            </button>

                            {createDropdownOpen && (
                                <div
                                    style={{
                                        position: "absolute",
                                        right: 0,
                                        top: "100%",
                                        marginTop: "6px",
                                        backgroundColor: "var(--color-canvas-overlay)",
                                        border: "1px solid var(--color-border-default)",
                                        borderRadius: "6px",
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                                        width: "180px",
                                        zIndex: 200,
                                        padding: "6px 0",
                                    }}
                                >
                                    <Link
                                        to="/new"
                                        onClick={() => setCreateDropdownOpen(false)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            padding: "8px 16px",
                                            color: "var(--color-fg-default)",
                                            textDecoration: "none",
                                            fontSize: "13px",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-border-muted)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                    >
                                        <RepoIcon size={16} />
                                        <span>New repository</span>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* User Avatar & Profile Dropdown */}
                        <div ref={userMenuRef} style={{ position: "relative" }}>
                            <button
                                onClick={() => setUserDropdownOpen((prev) => !prev)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    padding: 0,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <img
                                    src={
                                        currentUser?.avatarUrl ||
                                        `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser?.username || "user"}`
                                    }
                                    alt={currentUser?.username}
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "50%",
                                        border: "1px solid var(--color-border-default)",
                                        objectFit: "cover",
                                    }}
                                />
                            </button>

                            {userDropdownOpen && (
                                <div
                                    style={{
                                        position: "absolute",
                                        right: 0,
                                        top: "100%",
                                        marginTop: "6px",
                                        backgroundColor: "var(--color-canvas-overlay)",
                                        border: "1px solid var(--color-border-default)",
                                        borderRadius: "6px",
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                                        width: "210px",
                                        zIndex: 200,
                                        padding: "6px 0",
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: "8px 16px",
                                            borderBottom: "1px solid var(--color-border-default)",
                                            fontSize: "13px",
                                            color: "var(--color-fg-muted)",
                                        }}
                                    >
                                        Signed in as <br />
                                        <strong style={{ color: "var(--color-fg-default)" }}>
                                            {currentUser?.username}
                                        </strong>
                                    </div>

                                    <Link
                                        to={`/${currentUser?.username}`}
                                        onClick={() => setUserDropdownOpen(false)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            padding: "8px 16px",
                                            color: "var(--color-fg-default)",
                                            textDecoration: "none",
                                            fontSize: "13px",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-border-muted)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                    >
                                        <PersonIcon size={16} />
                                        <span>Your profile</span>
                                    </Link>

                                    <Link
                                        to="/settings"
                                        onClick={() => setUserDropdownOpen(false)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            padding: "8px 16px",
                                            color: "var(--color-fg-default)",
                                            textDecoration: "none",
                                            fontSize: "13px",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-border-muted)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                    >
                                        <GearIcon size={16} />
                                        <span>Settings</span>
                                    </Link>

                                    <div style={{ borderTop: "1px solid var(--color-border-default)", margin: "4px 0" }} />

                                    <button
                                        onClick={handleLogout}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            width: "100%",
                                            textAlign: "left",
                                            padding: "8px 16px",
                                            background: "transparent",
                                            border: "none",
                                            color: "var(--color-danger-fg)",
                                            fontSize: "13px",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-border-muted)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                    >
                                        <SignOutIcon size={16} />
                                        <span>Sign out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Link
                            to="/login"
                            style={{
                                padding: "5px 12px",
                                fontSize: "13px",
                                fontWeight: 500,
                                color: "var(--color-fg-default)",
                                textDecoration: "none",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "6px",
                            }}
                        >
                            Sign in
                        </Link>
                        <Link
                            to="/signup"
                            style={{
                                padding: "5px 12px",
                                fontSize: "13px",
                                fontWeight: 500,
                                color: "white",
                                backgroundColor: "var(--color-success-emphasis)",
                                textDecoration: "none",
                                borderRadius: "6px",
                            }}
                        >
                            Sign up
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
