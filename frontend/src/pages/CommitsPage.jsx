import { useParams } from "react-router";
import { useRepo } from "../hooks/useRepo";
import { useCommits } from "../hooks/useCommits";
import RepoLayout from "../layouts/RepoLayout";
import CommitList from "../components/repo/CommitList";

export const CommitsPage = () => {
    const { owner, repo: repoName, branch = "main" } = useParams();
    const { repo } = useRepo(owner, repoName);
    const { commits, loading } = useCommits(repo?._id, branch);

    return (
        <RepoLayout>
            <CommitList
                owner={owner}
                repoName={repoName}
                branch={branch}
                commits={commits}
                loading={loading}
            />
        </RepoLayout>
    );
};

export default CommitsPage;
