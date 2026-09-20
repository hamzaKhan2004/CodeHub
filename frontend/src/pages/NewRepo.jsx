import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import repoService from "../services/repoService";
import AppLayout from "../layouts/AppLayout";
import { RepoIcon, LockIcon, GlobeIcon } from "@primer/octicons-react";

export const NewRepo = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [initializeReadme, setInitializeReadme] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError("Repository name is required.");
            return;
        }

        if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedName)) {
            setError("Repository name can only contain alphanumeric characters, hyphens, underscores, and dots.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const newRepo = await repoService.createRepository({
                name: trimmedName,
                description: description.trim(),
                isPrivate,
                visibility: !isPrivate,
                initializeReadme,
            });

            navigate(`/${currentUser?.username || "user"}/${newRepo.name}`);
        } catch (err) {
            setError(err.message || "Failed to create repository.");
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div style={{ maxWidth: "780px", margin: "40px auto", padding: "0 24px", width: "100%" }}>
                <div style={{ borderBottom: "1px solid var(--color-border-default)", paddingBottom: "16px", marginBottom: "24px" }}>
                    <h1 style={{ fontSize: "24px", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
                        <RepoIcon size={24} />
                        Create a new repository
                    </h1>
                    <p style={{ color: "var(--color-fg-muted)", fontSize: "14px", marginTop: "8px", margin: 0 }}>
                        A repository contains all project files, including the revision history.
                    </p>
                </div>

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

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Owner / Repo Name Row */}
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "12px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                                Owner
                            </label>
                            <div
                                style={{
                                    padding: "6px 12px",
                                    backgroundColor: "var(--color-canvas-subtle)",
                                    border: "1px solid var(--color-border-default)",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                }}
                            >
                                {currentUser?.username || "user"}
                            </div>
                        </div>

                        <span style={{ fontSize: "20px", color: "var(--color-fg-muted)", paddingBottom: "6px" }}>/</span>

                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                                Repository name <span style={{ color: "var(--color-danger-fg)" }}>*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="my-awesome-project"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                style={{
                                    width: "100%",
                                    padding: "6px 12px",
                                    backgroundColor: "var(--color-canvas-default)",
                                    border: "1px solid var(--color-border-default)",
                                    borderRadius: "6px",
                                    color: "var(--color-fg-default)",
                                    fontSize: "14px",
                                    outline: "none",
                                }}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                            Description <span style={{ fontSize: "12px", color: "var(--color-fg-muted)", fontWeight: 400 }}>(optional)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Short description of your project..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "6px 12px",
                                backgroundColor: "var(--color-canvas-default)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "6px",
                                color: "var(--color-fg-default)",
                                fontSize: "14px",
                                outline: "none",
                            }}
                        />
                    </div>

                    <div style={{ borderTop: "1px solid var(--color-border-default)" }} />

                    {/* Visibility Selection: Public vs. Private */}
                    <div>
                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>
                            Visibility
                        </label>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "12px",
                                    padding: "12px",
                                    border: `1px solid ${!isPrivate ? "var(--color-accent-emphasis)" : "var(--color-border-default)"}`,
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    backgroundColor: !isPrivate ? "var(--color-canvas-subtle)" : "transparent",
                                }}
                            >
                                <input
                                    type="radio"
                                    name="visibility"
                                    checked={!isPrivate}
                                    onChange={() => setIsPrivate(false)}
                                    style={{ marginTop: "4px" }}
                                />
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "14px" }}>
                                        <GlobeIcon size={16} /> Public
                                    </div>
                                    <p style={{ fontSize: "12px", color: "var(--color-fg-muted)", margin: "4px 0 0" }}>
                                        Anyone on the internet can see this repository. You choose who can commit.
                                    </p>
                                </div>
                            </label>

                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "12px",
                                    padding: "12px",
                                    border: `1px solid ${isPrivate ? "var(--color-accent-emphasis)" : "var(--color-border-default)"}`,
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    backgroundColor: isPrivate ? "var(--color-canvas-subtle)" : "transparent",
                                }}
                            >
                                <input
                                    type="radio"
                                    name="visibility"
                                    checked={isPrivate}
                                    onChange={() => setIsPrivate(true)}
                                    style={{ marginTop: "4px" }}
                                />
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "14px" }}>
                                        <LockIcon size={16} /> Private
                                    </div>
                                    <p style={{ fontSize: "12px", color: "var(--color-fg-muted)", margin: "4px 0 0" }}>
                                        You choose who can see and commit to this repository.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div style={{ borderTop: "1px solid var(--color-border-default)" }} />

                    {/* Initialization options */}
                    <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={initializeReadme}
                                onChange={(e) => setInitializeReadme(e.target.checked)}
                            />
                            <span style={{ fontSize: "14px", fontWeight: 600 }}>Add a README file</span>
                        </label>
                        <p style={{ fontSize: "12px", color: "var(--color-fg-muted)", margin: "4px 0 0 24px" }}>
                            This is where you can write a long description for your project.
                        </p>
                    </div>

                    <div style={{ borderTop: "1px solid var(--color-border-default)" }} />

                    <div>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
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
                            {loading ? "Creating repository..." : "Create repository"}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default NewRepo;
