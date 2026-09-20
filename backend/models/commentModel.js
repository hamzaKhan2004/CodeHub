const mongoose = require("mongoose");
const { Schema } = mongoose;

const CommentSchema = new Schema(
    {
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        body: {
            type: String,
            required: true,
            trim: true,
        },
        targetType: {
            type: String,
            enum: ["Issue", "PullRequest"],
            required: true,
            index: true,
        },
        targetId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        repository: {
            type: Schema.Types.ObjectId,
            ref: "Repository",
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

CommentSchema.index({ targetType: 1, targetId: 1, createdAt: 1 });

const Comment = mongoose.model("Comment", CommentSchema);
module.exports = Comment;
