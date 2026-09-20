const mongoose = require("mongoose");
const { Schema } = mongoose;

const PullRequestSchema = new Schema(
    {
        number: {
            type: Number,
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        repository: {
            type: Schema.Types.ObjectId,
            ref: "Repository",
            required: true,
            index: true,
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        sourceBranch: {
            type: String,
            required: true,
        },
        targetBranch: {
            type: String,
            required: true,
            default: "main",
        },
        status: {
            type: String,
            enum: ["open", "closed", "merged"],
            default: "open",
            index: true,
        },
        mergedAt: {
            type: Date,
            default: null,
        },
        mergedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        closedAt: {
            type: Date,
            default: null,
        },
        closedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        commentsCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

PullRequestSchema.index({ repository: 1, number: 1 }, { unique: true });
PullRequestSchema.index({ repository: 1, status: 1, createdAt: -1 });

const PullRequest = mongoose.model("PullRequest", PullRequestSchema);
module.exports = PullRequest;
