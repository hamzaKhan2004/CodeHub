import { useState, useRef, useEffect } from "react";
import { GitBranchIcon, CheckIcon, PlusIcon } from "@primer/octicons-react";

export const BranchDropdown = ({ currentBranch, branches = [], onSelectBranch, onCreateBranch }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newBranchName, setNewBranchName] = useState("");
    const [loading, setLoading] = useState(false);

    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredBranches = branches.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreateBranch = async (e) => {
        e.preventDefault();
        if (!newBranchName.trim()) return;
        setLoading(true);
        try {
            await onCreateBranch(newBranchName.trim());
            setShowCreateModal(false);
            setNewBranchName("");
            setIsOpen(false);
        } catch (err) {
            alert(err.message || "Failed to create branch");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 12px",
                    backgroundColor: "var(--color-canvas-default)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "6px",
                    color: "var(--color-fg-default)",
                    fontSize: "13px",
                    fontWeight: 500,
                }}
            >
                <GitBranchIcon size={16} />
                <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {currentBranch}
                </span>
                <span style={{ fontSize: "10px", color: "var(--color-fg-muted)" }}>▼</span>
            </button>

            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        marginTop: "6px",
                        backgroundColor: "var(--color-canvas-overlay)",
                        border: "1px solid var(--color-border-default)",
                        borderRadius: "6px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                        width: "300px",
                        zIndex: 100,
                        overflow: "hidden",
                    }}
                >
                    <div style={{ padding: "8px", borderBottom: "1px solid var(--color-border-default)" }}>
                        <div style={{ fontWeight: 600, fontSize: "12px", marginBottom: "6px", color: "var(--color-fg-muted)" }}>
                            Switch branches
                        </div>
                        <input
                            type="text"
                            placeholder="Find or create a branch..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "6px 8px",
                                fontSize: "12px",
                                backgroundColor: "var(--color-canvas-default)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: "4px",
                                color: "var(--color-fg-default)",
                                outline: "none",
                            }}
                        />
                    </div>

                    <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                        {filteredBranches.map((b) => {
                            const isSelected = b.name === currentBranch;
                            return (
                                <div
                                    key={b._id || b.name}
                                    onClick={() => {
                                        onSelectBranch(b.name);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "8px 12px",
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        backgroundColor: isSelected ? "var(--color-border-muted)" : "transparent",
                                        color: "var(--color-fg-default)",
                                        borderBottom: "1px solid var(--color-border-muted)",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) e.currentTarget.style.backgroundColor = "var(--color-border-muted)";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                >
                                    <span style={{ fontWeight: isSelected ? 600 : 400 }}>{b.name}</span>
                                    {isSelected && <CheckIcon size={16} fill="var(--color-fg-default)" />}
                                </div>
                            );
                        })}

                        {filteredBranches.length === 0 && search && (
                            <div
                                onClick={() => setShowCreateModal(true)}
                                style={{
                                    padding: "10px 12px",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    color: "var(--color-accent-fg)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                <PlusIcon size={14} />
                                <span>Create branch: <strong>{search}</strong></span>
                            </div>
                        )}
                    </div>

                    {onCreateBranch && (
                        <div style={{ padding: "8px", borderTop: "1px solid var(--color-border-default)", backgroundColor: "var(--color-canvas-subtle)" }}>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                style={{
                                    width: "100%",
                                    padding: "6px",
                                    backgroundColor: "transparent",
                                    border: "none",
                                    color: "var(--color-accent-fg)",
                                    fontSize: "12px",
                                    textAlign: "left",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                <PlusIcon size={14} /> New branch
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Create Branch Modal */}
            {showCreateModal && (
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
                            padding: "20px",
                            width: "380px",
                            boxShadow: "0 16px 32px rgba(0,0,0,0.5)",
                        }}
                    >
                        <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>Create a branch</h3>
                        <p style={{ fontSize: "12px", color: "var(--color-fg-muted)", marginBottom: "12px" }}>
                            Branch will be created based on <strong>{currentBranch}</strong>
                        </p>
                        <form onSubmit={handleCreateBranch}>
                            <input
                                type="text"
                                placeholder="Branch name"
                                value={newBranchName}
                                onChange={(e) => setNewBranchName(e.target.value)}
                                autoFocus
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    borderRadius: "6px",
                                    backgroundColor: "var(--color-canvas-default)",
                                    border: "1px solid var(--color-border-default)",
                                    color: "var(--color-fg-default)",
                                    marginBottom: "16px",
                                    outline: "none",
                                }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
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
                                    disabled={loading || !newBranchName.trim()}
                                    style={{
                                        padding: "6px 16px",
                                        borderRadius: "6px",
                                        border: "none",
                                        backgroundColor: "var(--color-success-emphasis)",
                                        color: "white",
                                        fontWeight: 600,
                                    }}
                                >
                                    {loading ? "Creating..." : "Create branch"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchDropdown;
