import { Link } from "react-router";
import AppLayout from "../layouts/AppLayout";

export const NotFoundPage = () => {
    return (
        <AppLayout>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                    padding: "60px 24px",
                    textAlign: "center",
                }}
            >
                <h1 style={{ fontSize: "72px", fontWeight: 700, margin: 0, color: "var(--color-fg-muted)" }}>404</h1>
                <h2 style={{ fontSize: "24px", marginTop: "12px", marginBottom: "8px" }}>Page not found</h2>
                <p style={{ color: "var(--color-fg-muted)", maxWidth: "420px", marginBottom: "24px" }}>
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>
                <Link
                    to="/"
                    style={{
                        padding: "8px 18px",
                        backgroundColor: "var(--color-accent-emphasis)",
                        color: "white",
                        borderRadius: "6px",
                        fontWeight: 600,
                        textDecoration: "none",
                    }}
                >
                    Back to home
                </Link>
            </div>
        </AppLayout>
    );
};

export default NotFoundPage;
