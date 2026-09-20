const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");
const PullRequest = require("../models/pullRequestModel");

/**
 * Global Search Service
 * Searches across repositories, users, issues, and pull requests.
 */
class SearchService {
    async search(queryStr, { type = "all", page = 1, limit = 15 } = {}) {
        const q = (queryStr || "").trim();
        if (!q) {
            return {
                repositories: [],
                users: [],
                issues: [],
                pullRequests: [],
                counts: { repositories: 0, users: 0, issues: 0, pullRequests: 0 },
            };
        }

        const regex = new RegExp(q, "i");
        const skip = (page - 1) * limit;

        const results = {};
        const counts = {};

        // 1. Search Repositories
        if (type === "all" || type === "repositories") {
            const repoQuery = {
                $or: [{ visibility: true }, { isPrivate: false }],
                $and: [
                    {
                        $or: [{ name: regex }, { description: regex }, { topics: regex }],
                    },
                ],
            };

            const [repos, repoCount] = await Promise.all([
                Repository.find(repoQuery)
                    .sort({ starsCount: -1, updatedAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate("owner", "username name avatarUrl"),
                Repository.countDocuments(repoQuery),
            ]);

            results.repositories = repos;
            counts.repositories = repoCount;
        }

        // 2. Search Users
        if (type === "all" || type === "users") {
            const userQuery = {
                $or: [{ username: regex }, { name: regex }, { bio: regex }],
            };

            const [users, userCount] = await Promise.all([
                User.find(userQuery)
                    .select("-password")
                    .skip(skip)
                    .limit(limit),
                User.countDocuments(userQuery),
            ]);

            results.users = users;
            counts.users = userCount;
        }

        // 3. Search Issues
        if (type === "all" || type === "issues") {
            const issueQuery = {
                $or: [{ title: regex }, { description: regex }],
            };

            const [issues, issueCount] = await Promise.all([
                Issue.find(issueQuery)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate("author", "username name avatarUrl")
                    .populate("repository", "name owner"),
                Issue.countDocuments(issueQuery),
            ]);

            results.issues = issues;
            counts.issues = issueCount;
        }

        // 4. Search Pull Requests
        if (type === "all" || type === "pullRequests") {
            const prQuery = {
                $or: [{ title: regex }, { description: regex }],
            };

            const [prs, prCount] = await Promise.all([
                PullRequest.find(prQuery)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate("author", "username name avatarUrl")
                    .populate("repository", "name owner"),
                PullRequest.countDocuments(prQuery),
            ]);

            results.pullRequests = prs;
            counts.pullRequests = prCount;
        }

        return {
            query: q,
            type,
            page,
            limit,
            counts,
            ...results,
        };
    }
}

module.exports = new SearchService();
