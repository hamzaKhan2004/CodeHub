import { useParams, useNavigate } from "react-router";
import { useRepo } from "../hooks/useRepo";
import { useAuth } from "../hooks/useAuth";
import { useFileTree } from "../hooks/useFileTree";
import RepoLayout from "../layouts/RepoLayout";
import FileTree from "../components/repo/FileTree";

export const RepoOverview = () => {
    const { owner, repo: repoName, "*": splat } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { repo } = useRepo(owner, repoName);

    // If splat is present (e.g. from /:owner/:repo/tree/:branch/*)
    // Extract branch and subPath
    let activeBranch = repo?.defaultBranch || "main";
    let subPath = "";

    if (splat) {
        const parts = splat.split("/");
        activeBranch = parts[0] || activeBranch;
        subPath = parts.slice(1).join("/");
    }

    const {
        branch,
        setBranch,
        branches,
        tree,
        readme,
        latestCommit,
        loading,
        createBranch,
    } = useFileTree(repo?._id, activeBranch, subPath);

    const isOwner = currentUser && (repo?.owner?._id === currentUser.id || repo?.owner?.username === currentUser.username);

    const handleSelectBranch = (newBranch) => {
        setBranch(newBranch);
        if (subPath) {
            navigate(`/${owner}/${repoName}/tree/${newBranch}/${subPath}`);
        } else {
            navigate(`/${owner}/${repoName}`);
        }
    };

    return (
        <RepoLayout>
            <FileTree
                owner={owner}
                repoName={repoName}
                branch={branch}
                branches={branches}
                currentPath={subPath}
                tree={tree}
                readme={readme}
                latestCommit={latestCommit}
                onSelectBranch={handleSelectBranch}
                onCreateBranch={createBranch}
                canEdit={isOwner}
            />
        </RepoLayout>
    );
};

export default RepoOverview;
