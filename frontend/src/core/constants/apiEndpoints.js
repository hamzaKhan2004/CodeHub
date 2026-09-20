/**
 * API Endpoints Constants (Layer 4)
 */

export const API_ENDPOINTS = {
    // Auth
    LOGIN: "/login",
    SIGNUP: "/signup",
    ME: "/me",

    // Users
    USERS: "/users",
    USER_PROFILE: (id) => `/userProfile/${id}`,
    USER_BY_NAME: (username) => `/users/${username}`,
    USER_ACTIVITY: (id) => `/users/${id}/activity`,
    FOLLOW_USER: (id) => `/users/${id}/follow`,

    // Repositories
    REPOS: "/repo/all",
    REPO_CREATE: "/repo/create",
    REPO_BY_ID: (id) => `/repo/${id}`,
    REPO_BY_OWNER_NAME: (owner, name) => `/repo/owner/${owner}/${name}`,
    USER_REPOS: (userId) => `/repo/user/${userId}`,
    REPO_UPDATE: (id) => `/repo/update/${id}`,
    REPO_TOGGLE: (id) => `/repo/toggle/${id}`,
    REPO_DELETE: (id) => `/repo/delete/${id}`,
    REPO_STAR: (id) => `/repo/${id}/star`,

    // Code & Files
    BRANCHES: (repoId) => `/repos/${repoId}/branches`,
    DEFAULT_BRANCH: (repoId) => `/repos/${repoId}/branches/default`,
    FILE_TREE: (repoId) => `/repos/${repoId}/tree`,
    FILE_CONTENT: (repoId) => `/repos/${repoId}/blob`,
    FILE_COMMIT: (repoId) => `/repos/${repoId}/files`,
    COMMITS: (repoId) => `/repos/${repoId}/commits`,
    COMMIT_BY_SHA: (repoId, sha) => `/repos/${repoId}/commits/${sha}`,

    // Issues
    ISSUES: (repoId) => `/repos/${repoId}/issues`,
    ISSUE_DETAIL: (repoId, id) => `/repos/${repoId}/issues/${id}`,
    ISSUE_UPDATE: (id) => `/issue/update/${id}`,
    ISSUE_DELETE: (id) => `/issue/delete/${id}`,

    // Pull Requests
    PULL_REQUESTS: (repoId) => `/repos/${repoId}/pulls`,
    PULL_REQUEST_DETAIL: (repoId, id) => `/repos/${repoId}/pulls/${id}`,
    MERGE_PR: (repoId, id) => `/repos/${repoId}/pulls/${id}/merge`,
    CLOSE_PR: (repoId, id) => `/repos/${repoId}/pulls/${id}/close`,

    // Comments
    COMMENTS: (repoId) => `/repos/${repoId}/comments`,
    COMMENT_MUTATE: (id) => `/comments/${id}`,

    // Search
    SEARCH: "/search",

    // Notifications
    NOTIFICATIONS: "/notifications",
    UNREAD_NOTIFICATIONS_COUNT: "/notifications/unread-count",
    MARK_NOTIFICATION_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_NOTIFICATIONS_READ: "/notifications/read-all",
};
