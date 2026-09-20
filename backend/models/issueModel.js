const mongoose = require("mongoose");
const { Schema } = mongoose;

const IssueSchema = new Schema(
    {
        issueNumber: {
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
        status: {
            type: String,
            enum: ["open", "closed"],
            default: "open",
            index: true,
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
        assignees: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        labels: [
            {
                type: String,
                trim: true,
            },
        ],
        commentsCount: {
            type: Number,
            default: 0,
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
    },
    { timestamps: true }
);

// Compound Index: each issue number is unique within its repository
IssueSchema.index({ repository: 1, issueNumber: 1 }, { unique: true });
IssueSchema.index({ repository: 1, status: 1, createdAt: -1 });

const Issue = mongoose.model("Issue", IssueSchema);
module.exports = Issue;