import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useRepo } from "../hooks/useRepo";
import { useAuth } from "../hooks/useAuth";
import codeService from "../services/codeService";
import RepoLayout from "../layouts/RepoLayout";
import CodeViewer from "../components/repo/CodeViewer";

export const FileViewPage = () => {
    const { owner, repo: repoName, branch = "main", "*": filePath } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { repo } = useRepo(owner, repoName);

    const [fileData, setFileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadFile = async () => {
            if (!repo?._id || !filePath) return;
            setLoading(true);
            setError(null);
            try {
                const data = await codeService.getFileContent(repo._id, branch, filePath);
                setFileData(data);
            } catch (err) {
                setError(err.message || "Failed to load file content.");
            } finally {
                setLoading(false);
            }
        };

        loadFile();
    }, [repo?._id, branch, filePath]);

    const isOwner = currentUser && (repo?.owner?._id === currentUser.id || repo?.owner?.username === currentUser.username);

    const handleDeleteFile = async (pathToDelete) => {
        await codeService.deleteFile(repo._id, {
            branch,
            path: pathToDelete,
            message: `Delete ${pathToDelete}`,
        });
        navigate(`/${owner}/${repoName}`);
    };

    return (
        <RepoLayout>
            {loading ? (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                    Loading file...
                </div>
            ) : error || !fileData ? (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                    <h3>File not found</h3>
                    <p style={{ color: "var(--color-fg-muted)", margin: "8px 0 16px" }}>
                        {error || "The requested file does not exist on this branch."}
                    </p>
                    <Link to={`/${owner}/${repoName}`}>Back to code</Link>
                </div>
            ) : (
                <CodeViewer
                    owner={owner}
                    repoName={repoName}
                    branch={branch}
                    filePath={fileData.path}
                    content={fileData.content}
                    size={fileData.size}
                    canEdit={isOwner}
                    onDeleteFile={handleDeleteFile}
                />
            )}
        </RepoLayout>
    );
};

export default FileViewPage;
