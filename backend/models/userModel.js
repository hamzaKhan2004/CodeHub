const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        password: {
            type: String,
            select: false,
        },
        name: {
            type: String,
            default: "",
            trim: true,
        },
        avatarUrl: {
            type: String,
            default: "",
        },
        bio: {
            type: String,
            default: "",
            maxlength: 300,
        },
        location: {
            type: String,
            default: "",
        },
        website: {
            type: String,
            default: "",
        },
        company: {
            type: String,
            default: "",
        },
        repositories: [
            {
                type: Schema.Types.ObjectId,
                ref: "Repository",
            },
        ],
        followers: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        followedUsers: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        starRepos: [
            {
                type: Schema.Types.ObjectId,
                ref: "Repository",
            },
        ],
    },
    { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
module.exports = User;