import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { MarkGithubIcon } from "@primer/octicons-react";

export const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password) {
            setError("Email and password are required.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            await login({ email: email.trim(), password });
            navigate("/");
        } catch (err) {
            setError(err.message || "Invalid credentials. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                backgroundColor: "var(--color-canvas-default)",
            }}
        >
            <div style={{ marginBottom: "24px", textAlign: "center" }}>
                <Link to="/" style={{ color: "var(--color-fg-default)" }}>
                    <MarkGithubIcon size={48} />
                </Link>
                <h1 style={{ fontSize: "24px", fontWeight: 300, marginTop: "16px", marginBottom: 0 }}>
                    Sign in to CodeHub
                </h1>
            </div>

            {error && (
                <div
                    style={{
                        width: "100%",
                        maxWidth: "340px",
                        padding: "12px",
                        backgroundColor: "var(--color-diff-del-bg)",
                        color: "var(--color-danger-fg)",
                        border: "1px solid var(--color-danger-emphasis)",
                        borderRadius: "6px",
                        marginBottom: "16px",
                        fontSize: "13px",
                    }}
                >
                    {error}
                </div>
            )}

            <div
                style={{
                    width: "100%",
                    maxWidth: "340px",
                    backgroundColor: "var(--color-canvas-subtle)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "6px",
                    padding: "20px",
                }}
            >
                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "14px", marginBottom: "6px", color: "var(--color-fg-default)" }}>
                            Email address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
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

                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                            <label style={{ fontSize: "14px", color: "var(--color-fg-default)" }}>
                                Password
                            </label>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
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

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "8px",
                            backgroundColor: "var(--color-success-emphasis)",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: 600,
                            fontSize: "14px",
                            marginTop: "8px",
                        }}
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>

            <div
                style={{
                    width: "100%",
                    maxWidth: "340px",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "6px",
                    padding: "16px",
                    marginTop: "16px",
                    textAlign: "center",
                    fontSize: "14px",
                }}
            >
                New to CodeHub? <Link to="/signup">Create an account</Link>.
            </div>
        </div>
    );
};

export default LoginPage;
