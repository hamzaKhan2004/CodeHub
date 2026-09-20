import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import userService from "../services/userService";
import AppLayout from "../layouts/AppLayout";

export const UserSettingsPage = () => {
    const { currentUser, refreshUser } = useAuth();

    const [name, setName] = useState(currentUser?.name || "");
    const [bio, setBio] = useState(currentUser?.bio || "");
    const [location, setLocation] = useState(currentUser?.location || "");
    const [website, setWebsite] = useState(currentUser?.website || "");
    const [company, setCompany] = useState(currentUser?.company || "");
    const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "");
    const [password, setPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");
        try {
            await userService.updateProfile(currentUser.id || currentUser._id, {
                name,
                bio,
                location,
                website,
                company,
                avatarUrl,
                password: password.trim() || undefined,
            });
            await refreshUser();
            setMessage("Profile updated successfully!");
            setPassword("");
        } catch (err) {
            setError(err.message || "Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout>
            <div style={{ maxWidth: "720px", margin: "40px auto", padding: "0 24px", width: "100%" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>Public Profile</h1>
                <p style={{ color: "var(--color-fg-muted)", fontSize: "14px", marginBottom: "24px" }}>
                    Manage your account details and public information.
                </p>

                {message && (
                    <div
                        style={{
                            padding: "12px",
                            backgroundColor: "var(--color-diff-add-bg)",
                            color: "var(--color-success-fg)",
                            border: "1px solid var(--color-success-emphasis)",
                            borderRadius: "6px",
                            marginBottom: "20px",
                            fontSize: "13px",
                        }}
                    >
                        {message}
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            padding: "12px",
                            backgroundColor: "var(--color-diff-del-bg)",
                            color: "var(--color-danger-fg)",
                            border: "1px solid var(--color-danger-emphasis)",
                            borderRadius: "6px",
                            marginBottom: "20px",
                            fontSize: "13px",
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                backgroundColor: "var(--color-canvas-default)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "6px",
                                color: "var(--color-fg-default)",
                                fontSize: "14px",
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                            Bio
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell a little about yourself..."
                            rows={3}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                backgroundColor: "var(--color-canvas-default)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "6px",
                                color: "var(--color-fg-default)",
                                fontSize: "14px",
                                outline: "none",
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                            Avatar URL
                        </label>
                        <input
                            type="text"
                            placeholder="https://..."
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                backgroundColor: "var(--color-canvas-default)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "6px",
                                color: "var(--color-fg-default)",
                                fontSize: "14px",
                            }}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                                Company
                            </label>
                            <input
                                type="text"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    backgroundColor: "var(--color-canvas-default)",
                                    border: "1px solid var(--color-border-default)",
                                    borderRadius: "6px",
                                    color: "var(--color-fg-default)",
                                    fontSize: "14px",
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                                Location
                            </label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    backgroundColor: "var(--color-canvas-default)",
                                    border: "1px solid var(--color-border-default)",
                                    borderRadius: "6px",
                                    color: "var(--color-fg-default)",
                                    fontSize: "14px",
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                            Website URL
                        </label>
                        <input
                            type="text"
                            placeholder="https://yourwebsite.com"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                backgroundColor: "var(--color-canvas-default)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "6px",
                                color: "var(--color-fg-default)",
                                fontSize: "14px",
                            }}
                        />
                    </div>

                    <div style={{ borderTop: "1px solid var(--color-border-default)", paddingTop: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>Change Password</h3>
                        <p style={{ color: "var(--color-fg-muted)", fontSize: "12px", marginBottom: "12px" }}>
                            Leave blank if you do not want to change your password.
                        </p>
                        <input
                            type="password"
                            placeholder="New password (min 6 characters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                backgroundColor: "var(--color-canvas-default)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "6px",
                                color: "var(--color-fg-default)",
                                fontSize: "14px",
                            }}
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                padding: "8px 20px",
                                backgroundColor: "var(--color-success-emphasis)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontWeight: 600,
                                fontSize: "14px",
                            }}
                        >
                            {saving ? "Saving..." : "Update profile"}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default UserSettingsPage;
