const mongoose = require("mongoose");
const { Schema } = mongoose;

const FileSchema = new Schema(
    {
        repository: {
            type: Schema.Types.ObjectId,
            ref: "Repository",
            required: true,
            index: true,
        },
        branch: {
            type: String,
            required: true,
            default: "main",
            index: true,
        },
        path: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            default: "",
        },
        size: {
            type: Number,
            default: 0,
        },
        lastCommitSha: {
            type: String,
            default: "",
        },
        lastCommitMessage: {
            type: String,
            default: "",
        },
        lastCommitDate: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Unique file path per repository branch
FileSchema.index({ repository: 1, branch: 1, path: 1 }, { unique: true });

const RepoFile = mongoose.model("RepoFile", FileSchema);
module.exports = RepoFile;
