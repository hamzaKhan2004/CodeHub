import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { MarkGithubIcon } from "@primer/octicons-react";

export const SignupPage = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignup = async (e) => {
        e.preventDefault();
        const trimmedUser = username.trim();
        const trimmedEmail = email.trim();

        if (!trimmedUser || !trimmedEmail || !password) {
            setError("All required fields must be filled.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            await signup({ username: trimmedUser, email: trimmedEmail, password, name: name.trim() });
            navigate("/");
        } catch (err) {
            setError(err.message || "Registration failed. Please try again.");
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
                    Sign up for CodeHub
                </h1>
            </div>

            {error && (
                <div
                    style={{
                        width: "100%",
                        maxWidth: "360px",
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
                    maxWidth: "360px",
                    backgroundColor: "var(--color-canvas-subtle)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "6px",
                    padding: "24px",
                }}
            >
                <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "14px", marginBottom: "6px", color: "var(--color-fg-default)" }}>
                            Username <span style={{ color: "var(--color-danger-fg)" }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                            placeholder="username"
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
                        <label style={{ display: "block", fontSize: "14px", marginBottom: "6px", color: "var(--color-fg-default)" }}>
                            Email address <span style={{ color: "var(--color-danger-fg)" }}>*</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="name@example.com"
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
                        <label style={{ display: "block", fontSize: "14px", marginBottom: "6px", color: "var(--color-fg-default)" }}>
                            Full Name <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your Name"
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
                        <label style={{ display: "block", fontSize: "14px", marginBottom: "6px", color: "var(--color-fg-default)" }}>
                            Password <span style={{ color: "var(--color-danger-fg)" }}>*</span>
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="At least 6 characters"
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
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>
            </div>

            <div
                style={{
                    width: "100%",
                    maxWidth: "360px",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "6px",
                    padding: "16px",
                    marginTop: "16px",
                    textAlign: "center",
                    fontSize: "14px",
                }}
            >
                Already have an account? <Link to="/login">Sign in</Link>.
            </div>
        </div>
    );
};

export default SignupPage;
