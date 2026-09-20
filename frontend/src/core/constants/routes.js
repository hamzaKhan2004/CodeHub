/**
 * Frontend Route Constants (Layer 4)
 */

export const APP_ROUTES = {
    HOME: "/",
    DASHBOARD: "/",
    LOGIN: "/login",
    AUTH: "/auth",
    SIGNUP: "/signup",
    EXPLORE: "/explore",
    SEARCH: "/search",
    NEW_REPO: "/new",
    USER_SETTINGS: "/settings",
    NOTIFICATIONS: "/notifications",

    // User Profile
    USER_PROFILE: (username) => `/${username}`,

    // Repository Views
    REPO_OVERVIEW: (owner, repo) => `/${owner}/${repo}`,
    REPO_TREE: (owner, repo, branch, path = "") =>
        path ? `/${owner}/${repo}/tree/${branch}/${path}` : `/${owner}/${repo}/tree/${branch}`,
    REPO_BLOB: (owner, repo, branch, path) => `/${owner}/${repo}/blob/${branch}/${path}`,
    REPO_EDIT: (owner, repo, branch, path) => `/${owner}/${repo}/edit/${branch}/${path}`,
    REPO_NEW_FILE: (owner, repo, branch) => `/${owner}/${repo}/new/${branch}`,

    // Commits
    REPO_COMMITS: (owner, repo, branch = "main") => `/${owner}/${repo}/commits/${branch}`,
    COMMIT_DETAIL: (owner, repo, sha) => `/${owner}/${repo}/commit/${sha}`,

    // Issues
    REPO_ISSUES: (owner, repo) => `/${owner}/${repo}/issues`,
    NEW_ISSUE: (owner, repo) => `/${owner}/${repo}/issues/new`,
    ISSUE_DETAIL: (owner, repo, id) => `/${owner}/${repo}/issues/${id}`,

    // Pull Requests
    REPO_PULLS: (owner, repo) => `/${owner}/${repo}/pulls`,
    NEW_PULL: (owner, repo) => `/${owner}/${repo}/pulls/new`,
    PULL_DETAIL: (owner, repo, id) => `/${owner}/${repo}/pulls/${id}`,

    // Settings
    REPO_SETTINGS: (owner, repo) => `/${owner}/${repo}/settings`,
};
