import { useParams } from "react-router";
import { useRepo } from "../hooks/useRepo";
import { usePullRequests } from "../hooks/usePullRequests";
import RepoLayout from "../layouts/RepoLayout";
import PullRequestList from "../components/pr/PullRequestList";

export const PullRequestsPage = () => {
    const { owner, repo: repoName } = useParams();
    const { repo } = useRepo(owner, repoName);
    const {
        pullRequests,
        status,
        setStatus,
        counts,
        loading,
    } = usePullRequests(repo?._id);

    return (
        <RepoLayout>
            <PullRequestList
                owner={owner}
                repoName={repoName}
                pullRequests={pullRequests}
                status={status}
                setStatus={setStatus}
                counts={counts}
                loading={loading}
            />
        </RepoLayout>
    );
};

export default PullRequestsPage;
