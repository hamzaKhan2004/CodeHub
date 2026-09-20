const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/appError");

/**
 * Authentication Service
 * Handles user registration, credential verification, and JWT issuance.
 */
class AuthService {
    /**
     * Issue JWT token
     */
    generateToken(user) {
        return jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );
    }

    /**
     * Register a new user
     */
    async register({ username, email, password, name = "" }) {
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedUsername = username.toLowerCase().trim();

        // Check for existing user by email or username
        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail) {
            throw new AppError("An account with this email address already exists.", 409, "EMAIL_EXISTS");
        }

        const existingUsername = await User.findOne({ username: normalizedUsername });
        if (existingUsername) {
            throw new AppError("This username is already taken.", 409, "USERNAME_EXISTS");
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Deterministic default avatar URL
        const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${normalizedUsername}`;

        const newUser = await User.create({
            username: normalizedUsername,
            email: normalizedEmail,
            password: hashedPassword,
            name: name.trim() || normalizedUsername,
            avatarUrl,
            repositories: [],
            followers: [],
            followedUsers: [],
            starRepos: [],
        });

        const token = this.generateToken(newUser);

        return {
            user: {
                id: newUser._id,
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                name: newUser.name,
                avatarUrl: newUser.avatarUrl,
                bio: newUser.bio,
            },
            token,
        };
    }

    /**
     * Log in an existing user
     */
    async login({ email, password }) {
        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail }).select("+password");
        if (!user) {
            throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
        }

        const token = this.generateToken(user);

        return {
            user: {
                id: user._id,
                _id: user._id,
                username: user.username,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
            },
            token,
        };
    }

    /**
     * Get current user session
     */
    async getCurrentUser(userId) {
        const user = await User.findById(userId).select("-password");
        if (!user) {
            throw new AppError("User not found.", 404, "USER_NOT_FOUND");
        }

        return {
            id: user._id,
            _id: user._id,
            username: user.username,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            location: user.location,
            website: user.website,
            company: user.company,
            followersCount: user.followers ? user.followers.length : 0,
            followingCount: user.followedUsers ? user.followedUsers.length : 0,
            repositoriesCount: user.repositories ? user.repositories.length : 0,
        };
    }
}

module.exports = new AuthService();
