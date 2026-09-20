import { Navigate, useRoutes } from "react-router";
import { useAuth } from "./hooks/useAuth";

// Pages
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import NewRepo from "./pages/NewRepo";
import ExplorePage from "./pages/ExplorePage";
import SearchResultsPage from "./pages/SearchResultsPage";
import NotificationsPage from "./pages/NotificationsPage";
import UserSettingsPage from "./pages/UserSettingsPage";
import UserProfilePage from "./pages/UserProfilePage";
import RepoOverview from "./pages/RepoOverview";
import FileViewPage from "./pages/FileViewPage";
import FileEditPage from "./pages/FileEditPage";
import CommitsPage from "./pages/CommitsPage";
import CommitDetailPage from "./pages/CommitDetailPage";
import IssuesPage from "./pages/IssuesPage";
import NewIssuePage from "./pages/NewIssuePage";
import IssueDetailPage from "./pages/IssueDetailPage";
import PullRequestsPage from "./pages/PullRequestsPage";
import NewPullRequestPage from "./pages/NewPullRequestPage";
import PullRequestDetailPage from "./pages/PullRequestDetailPage";
import RepoSettingsPage from "./pages/RepoSettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--color-fg-muted)" }}>
                Loading CodeHub...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Public Only Route Guard (for login/signup)
const PublicOnlyRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return null;
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
};

const ProjectRoutes = () => {
    const routes = useRoutes([
        // Core Public & Dashboard
        { path: "/", element: <Dashboard /> },
        { path: "/explore", element: <ExplorePage /> },
        { path: "/search", element: <SearchResultsPage /> },

        // Auth
        {
            path: "/login",
            element: (
                <PublicOnlyRoute>
                    <LoginPage />
                </PublicOnlyRoute>
            ),
        },
        {
            path: "/auth",
            element: (
                <PublicOnlyRoute>
                    <LoginPage />
                </PublicOnlyRoute>
            ),
        },
        {
            path: "/signup",
            element: (
                <PublicOnlyRoute>
                    <SignupPage />
                </PublicOnlyRoute>
            ),
        },

        // Protected Creation & User Settings
        {
            path: "/new",
            element: (
                <ProtectedRoute>
                    <NewRepo />
                </ProtectedRoute>
            ),
        },
        {
            path: "/create",
            element: (
                <ProtectedRoute>
                    <NewRepo />
                </ProtectedRoute>
            ),
        },
        {
            path: "/settings",
            element: (
                <ProtectedRoute>
                    <UserSettingsPage />
                </ProtectedRoute>
            ),
        },
        {
            path: "/notifications",
            element: (
                <ProtectedRoute>
                    <NotificationsPage />
                </ProtectedRoute>
            ),
        },

        // Repository Views
        { path: "/:owner/:repo", element: <RepoOverview /> },
        { path: "/:owner/:repo/tree/*", element: <RepoOverview /> },
        { path: "/:owner/:repo/blob/*", element: <FileViewPage /> },
        {
            path: "/:owner/:repo/edit/*",
            element: (
                <ProtectedRoute>
                    <FileEditPage />
                </ProtectedRoute>
            ),
        },
        {
            path: "/:owner/:repo/new/*",
            element: (
                <ProtectedRoute>
                    <FileEditPage />
                </ProtectedRoute>
            ),
        },

        // Commits
        { path: "/:owner/:repo/commits", element: <CommitsPage /> },
        { path: "/:owner/:repo/commits/:branch", element: <CommitsPage /> },
        { path: "/:owner/:repo/commit/:sha", element: <CommitDetailPage /> },

        // Issues
        { path: "/:owner/:repo/issues", element: <IssuesPage /> },
        {
            path: "/:owner/:repo/issues/new",
            element: (
                <ProtectedRoute>
                    <NewIssuePage />
                </ProtectedRoute>
            ),
        },
        { path: "/:owner/:repo/issues/:issueId", element: <IssueDetailPage /> },

        // Pull Requests
        { path: "/:owner/:repo/pulls", element: <PullRequestsPage /> },
        {
            path: "/:owner/:repo/pulls/new",
            element: (
                <ProtectedRoute>
                    <NewPullRequestPage />
                </ProtectedRoute>
            ),
        },
        { path: "/:owner/:repo/pulls/:pullId", element: <PullRequestDetailPage /> },

        // Repository Settings (Owner Protected)
        {
            path: "/:owner/:repo/settings",
            element: (
                <ProtectedRoute>
                    <RepoSettingsPage />
                </ProtectedRoute>
            ),
        },

        // User Profile (/profile redirects to logged-in user profile, or /:username directly)
        {
            path: "/profile",
            element: (
                <ProtectedRoute>
                    <ProfileRedirect />
                </ProtectedRoute>
            ),
        },
        { path: "/:username", element: <UserProfilePage /> },

        // 404 Catch-all
        { path: "*", element: <NotFoundPage /> },
    ]);

    return routes;
};

const ProfileRedirect = () => {
    const { currentUser } = useAuth();
    if (currentUser?.username) {
        return <Navigate to={`/${currentUser.username}`} replace />;
    }
    return <Navigate to="/login" replace />;
};

export default ProjectRoutes;
