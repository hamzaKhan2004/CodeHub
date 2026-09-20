const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Repository = require("../models/repoModel");
const Commit = require("../models/commitModel");
const Issue = require("../models/issueModel");
const Notification = require("../models/notificationModel");
const AppError = require("../utils/appError");

/**
 * User Service
 * Handles profile retrieval, updates, social graph (followers/following), and activity aggregation.
 */
class UserService {
    /**
     * Get user profile by username or MongoDB ID
     */
    async getUserProfile(identifier, currentUserId = null) {
        let query = {};
        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
            query = { _id: identifier };
        } else {
            query = { username: identifier.toLowerCase().trim() };
        }

        const user = await User.findOne(query)
            .select("-password")
            .populate("followers", "username name avatarUrl")
            .populate("followedUsers", "username name avatarUrl")
            .populate("starRepos", "name description owner visibility isPrivate starsCount");

        if (!user) {
            throw new AppError("User not found.", 404, "USER_NOT_FOUND");
        }

        // Determine if current user follows this user
        const isFollowing = currentUserId
            ? user.followers.some((f) => f._id.toString() === currentUserId.toString())
            : false;

        // Fetch user's public repositories (or all if current user is owner)
        const isOwner = currentUserId && currentUserId.toString() === user._id.toString();
        const repoQuery = { owner: user._id };
        if (!isOwner) {
            repoQuery.$or = [{ visibility: true }, { isPrivate: false }];
        }

        const repositories = await Repository.find(repoQuery)
            .sort({ updatedAt: -1 })
            .populate("owner", "username name avatarUrl");

        return {
            user: {
                id: user._id,
                _id: user._id,
                username: user.username,
                name: user.name || user.username,
                email: user.email,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                location: user.location,
                website: user.website,
                company: user.company,
                createdAt: user.createdAt,
                followersCount: user.followers.length,
                followingCount: user.followedUsers.length,
                publicReposCount: repositories.length,
                isFollowing,
                isOwner,
            },
            repositories,
            followers: user.followers,
            following: user.followedUsers,
            starredRepositories: user.starRepos || [],
        };
    }

    /**
     * Update user profile
     */
    async updateUserProfile(userId, { name, bio, location, website, company, avatarUrl, password }) {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError("User not found.", 404, "USER_NOT_FOUND");
        }

        if (name !== undefined) user.name = name.trim();
        if (bio !== undefined) user.bio = bio.trim();
        if (location !== undefined) user.location = location.trim();
        if (website !== undefined) user.website = website.trim();
        if (company !== undefined) user.company = company.trim();
        if (avatarUrl !== undefined && avatarUrl.trim()) user.avatarUrl = avatarUrl.trim();

        if (password && password.trim().length >= 6) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        return {
            id: user._id,
            _id: user._id,
            username: user.username,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            location: user.location,
            website: user.website,
            company: user.company,
        };
    }

    /**
     * Delete user profile and clean up associated records
     */
    async deleteUserProfile(userId) {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            throw new AppError("User not found.", 404, "USER_NOT_FOUND");
        }

        // Clean up repositories owned by this user
        await Repository.deleteMany({ owner: userId });

        return { message: "Account and associated repositories deleted successfully." };
    }

    /**
     * Follow a user
     */
    async followUser(currentUserId, targetUserId) {
        if (currentUserId.toString() === targetUserId.toString()) {
            throw new AppError("You cannot follow yourself.", 400, "CANNOT_FOLLOW_SELF");
        }

        const [currentUser, targetUser] = await Promise.all([
            User.findById(currentUserId),
            User.findById(targetUserId),
        ]);

        if (!targetUser) {
            throw new AppError("User to follow does not exist.", 404, "USER_NOT_FOUND");
        }

        const alreadyFollowing = currentUser.followedUsers.some(
            (id) => id.toString() === targetUserId.toString()
        );

        if (!alreadyFollowing) {
            currentUser.followedUsers.push(targetUserId);
            targetUser.followers.push(currentUserId);

            await Promise.all([currentUser.save(), targetUser.save()]);

            // Create notification for the followed user
            await Notification.create({
                recipient: targetUserId,
                sender: currentUserId,
                type: "follow",
            });
        }

        return {
            isFollowing: true,
            followersCount: targetUser.followers.length,
        };
    }

    /**
     * Unfollow a user
     */
    async unfollowUser(currentUserId, targetUserId) {
        const [currentUser, targetUser] = await Promise.all([
            User.findById(currentUserId),
            User.findById(targetUserId),
        ]);

        if (!targetUser) {
            throw new AppError("User does not exist.", 404, "USER_NOT_FOUND");
        }

        currentUser.followedUsers = currentUser.followedUsers.filter(
            (id) => id.toString() !== targetUserId.toString()
        );
        targetUser.followers = targetUser.followers.filter(
            (id) => id.toString() !== currentUserId.toString()
        );

        await Promise.all([currentUser.save(), targetUser.save()]);

        return {
            isFollowing: false,
            followersCount: targetUser.followers.length,
        };
    }

    /**
     * Calculate user activity heatmap data
     * Computes daily contribution counts from Commits and Issues
     */
    async getUserActivity(userId) {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const [commits, issues] = await Promise.all([
            Commit.find({ author: userId, createdAt: { $gte: oneYearAgo } }).select("createdAt"),
            Issue.find({ author: userId, createdAt: { $gte: oneYearAgo } }).select("createdAt"),
        ]);

        const countsByDate = {};

        commits.forEach((c) => {
            const dateStr = c.createdAt.toISOString().split("T")[0];
            countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
        });

        issues.forEach((i) => {
            const dateStr = i.createdAt.toISOString().split("T")[0];
            countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
        });

        const activityData = Object.entries(countsByDate).map(([date, count]) => ({
            date,
            count,
        }));

        const totalContributions = activityData.reduce((acc, curr) => acc + curr.count, 0);

        return {
            activityData,
            totalContributions,
        };
    }

    /**
     * Get all users (compatible with existing route)
     */
    async getAllUsers(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            User.find({}).select("-password").skip(skip).limit(limit).sort({ createdAt: -1 }),
            User.countDocuments(),
        ]);

        return { users, total, page, limit };
    }
}

module.exports = new UserService();
