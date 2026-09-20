const authService = require("../services/authService");
const userService = require("../services/userService");
const { successResponse } = require("../utils/apiResponse");

/**
 * User & Authentication Controller
 * Pure HTTP transport handler: parses requests, delegates to services, and formats standard responses.
 */

const signup = async (req, res, next) => {
    try {
        const { username, email, password, name } = req.body;
        const result = await authService.register({ username, email, password, name });
        return successResponse(res, 201, "User registered successfully.", result);
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login({ email, password });
        return successResponse(res, 200, "Login successful.", result);
    } catch (err) {
        next(err);
    }
};

const getCurrentUser = async (req, res, next) => {
    try {
        const user = await authService.getCurrentUser(req.user._id);
        return successResponse(res, 200, "Current user session retrieved.", { user });
    } catch (err) {
        next(err);
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await userService.getAllUsers(page, limit);
        return successResponse(res, 200, "Users retrieved successfully.", result);
    } catch (err) {
        next(err);
    }
};

const getUserProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user ? req.user._id : null;
        const profile = await userService.getUserProfile(id, currentUserId);
        return successResponse(res, 200, "User profile retrieved successfully.", profile);
    } catch (err) {
        next(err);
    }
};

const updateUserProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updated = await userService.updateUserProfile(id, req.body);
        return successResponse(res, 200, "User profile updated successfully.", { user: updated });
    } catch (err) {
        next(err);
    }
};

const deleteUserProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await userService.deleteUserProfile(id);
        return successResponse(res, 200, "User profile deleted successfully.", result);
    } catch (err) {
        next(err);
    }
};

const followUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await userService.followUser(req.user._id, id);
        return successResponse(res, 200, "User followed successfully.", result);
    } catch (err) {
        next(err);
    }
};

const unfollowUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await userService.unfollowUser(req.user._id, id);
        return successResponse(res, 200, "User unfollowed successfully.", result);
    } catch (err) {
        next(err);
    }
};

const getUserActivity = async (req, res, next) => {
    try {
        const { id } = req.params;
        const activity = await userService.getUserActivity(id);
        return successResponse(res, 200, "User activity data retrieved.", activity);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    signup,
    login,
    getCurrentUser,
    getAllUsers,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile,
    followUser,
    unfollowUser,
    getUserActivity,
};