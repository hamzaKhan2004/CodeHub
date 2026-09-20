import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useRepo } from "../hooks/useRepo";
import codeService from "../services/codeService";
import RepoLayout from "../layouts/RepoLayout";
import FileEditor from "../components/repo/FileEditor";

export const FileEditPage = () => {
    const { owner, repo: repoName, branch = "main", "*": filePath } = useParams();
    const navigate = useNavigate();
    const { repo } = useRepo(owner, repoName);

    const [initialContent, setInitialContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [isNew, setIsNew] = useState(false);

    useEffect(() => {
        const loadInitialFile = async () => {
            if (!repo?._id || !filePath) {
                setLoading(false);
                setIsNew(true);
                return;
            }

            try {
                const data = await codeService.getFileContent(repo._id, branch, filePath);
                setInitialContent(data.content || "");
                setIsNew(false);
            } catch {
                // If file doesn't exist, treat as creating a new file
                setInitialContent("");
                setIsNew(true);
            } finally {
                setLoading(false);
            }
        };

        loadInitialFile();
    }, [repo?._id, branch, filePath]);

    const handleSave = async ({ path, content, message }) => {
        await codeService.commitFile(repo._id, {
            branch,
            path,
            content,
            message,
        });
    };

    return (
        <RepoLayout>
            {loading ? (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                    Loading editor...
                </div>
            ) : (
                <FileEditor
                    owner={owner}
                    repoName={repoName}
                    branch={branch}
                    initialPath={filePath || ""}
                    initialContent={initialContent}
                    isNew={isNew}
                    onSave={handleSave}
                />
            )}
        </RepoLayout>
    );
};

export default FileEditPage;
