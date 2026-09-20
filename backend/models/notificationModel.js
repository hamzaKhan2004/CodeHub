const mongoose = require("mongoose");
const { Schema } = mongoose;

const NotificationSchema = new Schema(
    {
        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: [
                "star",
                "fork",
                "follow",
                "issue_created",
                "issue_comment",
                "pr_created",
                "pr_comment",
                "pr_merged",
            ],
            required: true,
        },
        repository: {
            type: Schema.Types.ObjectId,
            ref: "Repository",
        },
        issue: {
            type: Schema.Types.ObjectId,
            ref: "Issue",
        },
        pullRequest: {
            type: Schema.Types.ObjectId,
            ref: "PullRequest",
        },
        read: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true }
);

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;
