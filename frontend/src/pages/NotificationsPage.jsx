import { useNotifications } from "../hooks/useNotifications";
import AppLayout from "../layouts/AppLayout";
import { formatDate } from "../core/utils/dateFormatter";
import {
    BellIcon,
    StarIcon,
    GitPullRequestIcon,
    IssueOpenedIcon,
    CheckIcon,
} from "@primer/octicons-react";

export const NotificationsPage = () => {
    const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

    const getIcon = (type) => {
        switch (type) {
            case "star":
                return <StarIcon size={16} fill="var(--color-attention-fg)" />;
            case "pr_created":
            case "pr_merged":
                return <GitPullRequestIcon size={16} fill="#8957e5" />;
            case "issue_created":
            case "issue_comment":
                return <IssueOpenedIcon size={16} fill="var(--color-success-fg)" />;
            default:
                return <BellIcon size={16} />;
        }
    };

    return (
        <AppLayout>
            <div style={{ maxWidth: "880px", margin: "40px auto", padding: "0 24px", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <h1 style={{ fontSize: "22px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                        <BellIcon size={22} /> Notifications
                    </h1>

                    {notifications.some((n) => !n.read) && (
                        <button
                            onClick={markAllAsRead}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                backgroundColor: "var(--color-canvas-subtle)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "6px",
                                color: "var(--color-fg-default)",
                                fontSize: "12px",
                                fontWeight: 500,
                            }}
                        >
                            <CheckIcon size={14} /> Mark all as read
                        </button>
                    )}
                </div>

                <div
                    style={{
                        border: "1px solid var(--color-border-default)",
                        borderRadius: "6px",
                        overflow: "hidden",
                        backgroundColor: "var(--color-canvas-default)",
                    }}
                >
                    {loading ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                            Loading notifications...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                            <BellIcon size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
                            <h3>All caught up!</h3>
                            <p style={{ fontSize: "13px", marginTop: "4px" }}>
                                You have no new notifications.
                            </p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n._id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "16px",
                                    borderBottom: "1px solid var(--color-border-muted)",
                                    backgroundColor: n.read ? "transparent" : "var(--color-canvas-subtle)",
                                    gap: "12px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    {getIcon(n.type)}
                                    <div>
                                        <div style={{ fontSize: "14px", color: "var(--color-fg-default)" }}>
                                            <strong>{n.sender?.username || "Someone"}</strong>{" "}
                                            {n.type === "star" && `starred ${n.repository?.name || "your repository"}`}
                                            {n.type === "follow" && "started following you"}
                                            {n.type === "issue_created" && `opened issue #${n.issue?.issueNumber || ""}`}
                                            {n.type === "pr_created" && `opened pull request #${n.pullRequest?.number || ""}`}
                                            {n.type === "pr_merged" && `merged pull request #${n.pullRequest?.number || ""}`}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "var(--color-fg-muted)", marginTop: "2px" }}>
                                            {formatDate(n.createdAt)}
                                        </div>
                                    </div>
                                </div>

                                {!n.read && (
                                    <button
                                        onClick={() => markAsRead(n._id)}
                                        style={{
                                            padding: "4px 8px",
                                            fontSize: "12px",
                                            borderRadius: "4px",
                                            border: "1px solid var(--color-border-default)",
                                            backgroundColor: "var(--color-canvas-default)",
                                            color: "var(--color-fg-default)",
                                        }}
                                    >
                                        Mark read
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default NotificationsPage;
