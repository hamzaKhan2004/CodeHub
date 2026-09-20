import { useParams } from "react-router";
import { useRepo } from "../hooks/useRepo";
import { useIssues } from "../hooks/useIssues";
import RepoLayout from "../layouts/RepoLayout";
import IssueList from "../components/issue/IssueList";

export const IssuesPage = () => {
    const { owner, repo: repoName } = useParams();
    const { repo } = useRepo(owner, repoName);
    const {
        issues,
        status,
        setStatus,
        search,
        setSearch,
        counts,
        loading,
    } = useIssues(repo?._id);

    return (
        <RepoLayout>
            <IssueList
                owner={owner}
                repoName={repoName}
                issues={issues}
                status={status}
                setStatus={setStatus}
                search={search}
                setSearch={setSearch}
                counts={counts}
                loading={loading}
            />
        </RepoLayout>
    );
};

export default IssuesPage;
