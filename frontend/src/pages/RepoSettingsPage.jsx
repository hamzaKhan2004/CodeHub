import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useRepo } from "../hooks/useRepo";
import { useAuth } from "../hooks/useAuth";
import RepoLayout from "../layouts/RepoLayout";
import { AlertIcon } from "@primer/octicons-react";

export const RepoSettingsPage = () => {
    const { owner, repo: repoName } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { repo, updateRepo, deleteRepo } = useRepo(owner, repoName);

    const [description, setDescription] = useState(repo?.description || "");
    const [saving, setSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const expectedConfirm = `${owner}/${repoName}`;

    const handleSaveGeneral = async (e) => {
        e.preventDefault();
        setSaving(true);
        setStatusMessage("");
        try {
            await updateRepo({ description });
            setStatusMessage("Repository settings updated.");
        } catch (err) {
            alert(err.message || "Failed to update repository.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleVisibility = async () => {
        const nextVis = !repo.visibility;
        if (
            window.confirm(
                `Are you sure you want to change this repository to ${nextVis ? "public" : "private"}?`
            )
        ) {
            try {
                await updateRepo({ visibility: nextVis });
                setStatusMessage(`Repository is now ${nextVis ? "public" : "private"}.`);
            } catch (err) {
                alert(err.message || "Failed to toggle visibility.");
            }
        }
    };

    const handleDelete = async (e) => {
        e.preventDefault();
        if (confirmText.trim() !== expectedConfirm) return;
        setDeleting(true);
        try {
            await deleteRepo();
            navigate("/");
        } catch (err) {
            alert(err.message || "Failed to delete repository.");
            setDeleting(false);
        }
    };

    return (
        <RepoLayout>
            <div style={{ maxWidth: "880px", margin: "0 auto" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px" }}>Repository Settings</h2>

                {statusMessage && (
                    <div
                        style={{
                            padding: "10px 14px",
                            backgroundColor: "var(--color-diff-add-bg)",
                            color: "var(--color-success-fg)",
                            border: "1px solid var(--color-success-emphasis)",
                            borderRadius: "6px",
                            marginBottom: "20px",
                            fontSize: "13px",
                        }}
                    >
                        {statusMessage}
                    </div>
                )}

                {/* General Settings */}
                <div
                    style={{
                        border: "1px solid var(--color-border-default)",
                        borderRadius: "6px",
                        backgroundColor: "var(--color-canvas-default)",
                        padding: "20px",
                        marginBottom: "32px",
                    }}
                >
                    <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>General</h3>
                    <form onSubmit={handleSaveGeneral}>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                                Repository description
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--color-border-default)",
                                    backgroundColor: "var(--color-canvas-subtle)",
                                    color: "var(--color-fg-default)",
                                    fontSize: "13px",
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                padding: "6px 14px",
                                backgroundColor: "var(--color-canvas-subtle)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "6px",
                                color: "var(--color-fg-default)",
                                fontWeight: 500,
                                fontSize: "13px",
                            }}
                        >
                            {saving ? "Saving..." : "Save changes"}
                        </button>
                    </form>
                </div>

                {/* Danger Zone */}
                <div
                    style={{
                        border: "1px solid var(--color-danger-emphasis)",
                        borderRadius: "6px",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "var(--color-diff-del-bg)",
                            padding: "12px 16px",
                            fontWeight: 600,
                            color: "var(--color-danger-fg)",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <AlertIcon size={16} /> Danger Zone
                    </div>

                    <div style={{ padding: "16px 20px", backgroundColor: "var(--color-canvas-default)" }}>
                        {/* Change Visibility */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingBottom: "16px",
                                borderBottom: "1px solid var(--color-border-muted)",
                            }}
                        >
                            <div>
                                <strong style={{ fontSize: "14px" }}>Change repository visibility</strong>
                                <div style={{ fontSize: "12px", color: "var(--color-fg-muted)", marginTop: "2px" }}>
                                    This repository is currently{" "}
                                    <strong>{repo.isPrivate || repo.visibility === false ? "Private" : "Public"}</strong>.
                                </div>
                            </div>
                            <button
                                onClick={handleToggleVisibility}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--color-border-default)",
                                    backgroundColor: "var(--color-canvas-subtle)",
                                    color: "var(--color-danger-fg)",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                }}
                            >
                                Change visibility
                            </button>
                        </div>

                        {/* Delete Repository */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingTop: "16px",
                            }}
                        >
                            <div>
                                <strong style={{ fontSize: "14px", color: "var(--color-danger-fg)" }}>
                                    Delete this repository
                                </strong>
                                <div style={{ fontSize: "12px", color: "var(--color-fg-muted)", marginTop: "2px" }}>
                                    Once you delete a repository, there is no going back. Please be certain.
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--color-danger-emphasis)",
                                    backgroundColor: "var(--color-danger-emphasis)",
                                    color: "white",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                }}
                            >
                                Delete repository
                            </button>
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0,0,0,0.6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1000,
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: "var(--color-canvas-overlay)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "8px",
                                padding: "24px",
                                width: "440px",
                                boxShadow: "0 16px 32px rgba(0,0,0,0.5)",
                            }}
                        >
                            <h3 style={{ fontSize: "18px", color: "var(--color-danger-fg)", marginBottom: "12px" }}>
                                Delete {owner}/{repoName}
                            </h3>
                            <p style={{ fontSize: "13px", color: "var(--color-fg-default)", lineHeight: "1.5", marginBottom: "16px" }}>
                                This action <strong>cannot</strong> be undone. This will permanently delete the{" "}
                                <strong>{owner}/{repoName}</strong> repository, branches, commits, files, and issues.
                            </p>
                            <p style={{ fontSize: "13px", color: "var(--color-fg-muted)", marginBottom: "8px" }}>
                                Please type <strong>{expectedConfirm}</strong> to confirm.
                            </p>

                            <form onSubmit={handleDelete}>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    autoFocus
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        backgroundColor: "var(--color-canvas-default)",
                                        border: "1px solid var(--color-border-default)",
                                        color: "var(--color-fg-default)",
                                        fontSize: "13px",
                                        marginBottom: "16px",
                                    }}
                                />

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(false)}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "6px",
                                            border: "1px solid var(--color-border-default)",
                                            backgroundColor: "transparent",
                                            color: "var(--color-fg-default)",
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={deleting || confirmText.trim() !== expectedConfirm}
                                        style={{
                                            padding: "6px 16px",
                                            borderRadius: "6px",
                                            border: "none",
                                            backgroundColor: "var(--color-danger-emphasis)",
                                            color: "white",
                                            fontWeight: 600,
                                            fontSize: "13px",
                                            opacity: confirmText.trim() === expectedConfirm ? 1 : 0.6,
                                        }}
                                    >
                                        {deleting ? "Deleting..." : "I understand, delete this repository"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </RepoLayout>
    );
};

export default RepoSettingsPage;
