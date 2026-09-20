import { useState } from "react";
import { formatDate } from "../../core/utils/dateFormatter";
import { useAuth } from "../../hooks/useAuth";
import { PencilIcon, TrashIcon } from "@primer/octicons-react";

export const CommentItem = ({ comment, onEdit, onDelete }) => {
    const { currentUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editedBody, setEditedBody] = useState(comment.body);
    const [loading, setLoading] = useState(false);

    const isAuthor = currentUser && (currentUser.id === comment.author?._id || currentUser.username === comment.author?.username);

    const handleSave = async () => {
        if (!editedBody.trim()) return;
        setLoading(true);
        try {
            await onEdit(comment._id, editedBody.trim());
            setIsEditing(false);
        } catch (err) {
            alert(err.message || "Failed to update comment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
            <img
                src={comment.author?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${comment.author?.username || "user"}`}
                alt={comment.author?.username}
                style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid var(--color-border-default)", marginTop: "2px" }}
            />

            <div
                style={{
                    flex: 1,
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "6px",
                    overflow: "hidden",
                    backgroundColor: "var(--color-canvas-default)",
                }}
            >
                <div
                    style={{
                        backgroundColor: "var(--color-canvas-subtle)",
                        padding: "8px 16px",
                        borderBottom: "1px solid var(--color-border-default)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "13px",
                    }}
                >
                    <div>
                        <strong style={{ color: "var(--color-fg-default)" }}>{comment.author?.username || "Unknown"}</strong>{" "}
                        <span style={{ color: "var(--color-fg-muted)" }}>commented {formatDate(comment.createdAt)}</span>
                    </div>

                    {isAuthor && !isEditing && (
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                onClick={() => setIsEditing(true)}
                                style={{ background: "transparent", border: "none", color: "var(--color-fg-muted)", cursor: "pointer" }}
                                title="Edit comment"
                            >
                                <PencilIcon size={14} />
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm("Delete this comment?")) {
                                        onDelete(comment._id);
                                    }
                                }}
                                style={{ background: "transparent", border: "none", color: "var(--color-danger-fg)", cursor: "pointer" }}
                                title="Delete comment"
                            >
                                <TrashIcon size={14} />
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ padding: "16px", fontSize: "14px", lineHeight: "1.6", color: "var(--color-fg-default)" }}>
                    {isEditing ? (
                        <div>
                            <textarea
                                value={editedBody}
                                onChange={(e) => setEditedBody(e.target.value)}
                                rows={4}
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
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    style={{
                                        padding: "4px 10px",
                                        borderRadius: "4px",
                                        border: "1px solid var(--color-border-default)",
                                        backgroundColor: "transparent",
                                        color: "var(--color-fg-default)",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading || !editedBody.trim()}
                                    style={{
                                        padding: "4px 12px",
                                        borderRadius: "4px",
                                        border: "none",
                                        backgroundColor: "var(--color-success-emphasis)",
                                        color: "white",
                                        fontWeight: 600,
                                    }}
                                >
                                    {loading ? "Saving..." : "Update comment"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{comment.body}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export const CommentBox = ({ onAddComment, onToggleStatus, status, canToggleStatus = false }) => {
    const { currentUser } = useAuth();
    const [body, setBody] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setLoading(true);
        try {
            await onAddComment(body.trim());
            setBody("");
        } catch (err) {
            alert(err.message || "Failed to post comment.");
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) {
        return (
            <div style={{ padding: "16px", backgroundColor: "var(--color-canvas-subtle)", borderRadius: "6px", textAlign: "center", border: "1px solid var(--color-border-default)" }}>
                Please sign in to leave a comment.
            </div>
        );
    }

    return (
        <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
            <img
                src={currentUser?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser?.username || "user"}`}
                alt={currentUser?.username}
                style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid var(--color-border-default)" }}
            />

            <div style={{ flex: 1, border: "1px solid var(--color-border-default)", borderRadius: "6px", backgroundColor: "var(--color-canvas-default)" }}>
                <div style={{ padding: "8px 16px", backgroundColor: "var(--color-canvas-subtle)", borderBottom: "1px solid var(--color-border-default)", fontWeight: 600, fontSize: "13px" }}>
                    Write a comment
                </div>

                <div style={{ padding: "16px" }}>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Leave a comment..."
                        rows={4}
                        style={{
                            width: "100%",
                            padding: "8px 12px",
                            backgroundColor: "var(--color-canvas-subtle)",
                            border: "1px solid var(--color-border-default)",
                            borderRadius: "6px",
                            color: "var(--color-fg-default)",
                            fontSize: "13px",
                            outline: "none",
                            resize: "vertical",
                        }}
                    />

                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px", marginTop: "12px" }}>
                        {canToggleStatus && onToggleStatus && (
                            <button
                                type="button"
                                onClick={onToggleStatus}
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--color-border-default)",
                                    backgroundColor: "var(--color-canvas-subtle)",
                                    color: "var(--color-fg-default)",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                }}
                            >
                                {status === "open" ? "Close issue" : "Reopen issue"}
                            </button>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !body.trim()}
                            style={{
                                padding: "6px 16px",
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: "var(--color-success-emphasis)",
                                color: "white",
                                fontWeight: 600,
                                fontSize: "13px",
                            }}
                        >
                            {loading ? "Posting..." : "Comment"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommentBox;
